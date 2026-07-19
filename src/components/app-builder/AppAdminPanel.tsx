"use client";

import type { AppRoute, AppUserView } from "@/components/app-builder/StandaloneAppRuntime";
import {
  extractPaletteFromImageSource,
  uploadAppImage,
} from "@/lib/app-builder/extract-palette-client";
import { buildLaunchChecklist } from "@/lib/app-builder/launch-checklist";
import type { EcomLocalShopContent, EcomProduct } from "@/lib/app-builder/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Contact,
  FileText,
  ImagePlus,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Palette,
  Shield,
  ShoppingBag,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  items: Array<{ name: string; price: string; qty: number }>;
  note?: string;
  createdAt: string;
};

type Role = {
  id: string;
  label: string;
  description: string;
  capabilities: string[];
  system?: boolean;
  isDefault?: boolean;
};

type Member = {
  id: string;
  email: string;
  name: string;
  roleId: string;
  source?: string;
};

type CrmContact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage: string;
  source: string;
  notes?: string;
  orderCount: number;
  lastActivityAt: string;
};

type NavItem = {
  id: AppRoute;
  label: string;
  description?: string;
  icon: typeof Package;
  staffOk?: boolean;
  group?: string;
};

/** Order matches real owner workflow: stock → orders → people → pages → brand → team */
const NAV: NavItem[] = [
  {
    id: "admin",
    label: "Overview",
    description: "Home & launch checklist",
    icon: LayoutDashboard,
    staffOk: true,
  },
  {
    id: "admin-products",
    label: "Products",
    description: "Catalogue · upload or find photos",
    icon: Package,
  },
  {
    id: "admin-orders",
    label: "Orders",
    description: "Orders & fulfilment",
    icon: ShoppingBag,
    staffOk: true,
  },
  {
    id: "admin-crm",
    label: "CRM",
    description: "Customers & contacts",
    icon: Contact,
    staffOk: true,
  },
  {
    id: "admin-cms",
    label: "Site CMS",
    description: "Edit Home, About, Contact, FAQ",
    icon: LayoutGrid,
  },
  {
    id: "admin-settings",
    label: "Brand & theme",
    description: "Logo upload · colours from logo",
    icon: Palette,
  },
  {
    id: "admin-customers",
    label: "Team",
    description: "Staff accounts",
    icon: Users,
  },
  {
    id: "admin-roles",
    label: "Roles",
    description: "Who can do what",
    icon: Shield,
  },
];

function emptyProduct(): EcomProduct {
  return {
    id: `p-${Date.now().toString(36)}`,
    name: "",
    description: "",
    price: "₹0",
    category: "General",
    featured: false,
  };
}

export function AppAdminPanel({
  slug,
  content,
  accent,
  user,
  section,
  onSection,
  onContentUpdated,
  staffOnly,
}: {
  slug: string;
  content: EcomLocalShopContent;
  accent: string;
  user: AppUserView;
  section: AppRoute;
  onSection: (r: AppRoute) => void;
  onContentUpdated: (c: EcomLocalShopContent) => void;
  staffOnly?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [defaultRoleId, setDefaultRoleId] = useState("customer");
  const [members, setMembers] = useState<Member[]>([]);
  const [products, setProducts] = useState<EcomProduct[]>(content.products || []);
  const [imagePicker, setImagePicker] = useState<{
    index: number;
    loading: boolean;
    options: Array<{ url: string; source: string; label: string }>;
  } | null>(null);
  const [invite, setInvite] = useState({ email: "", name: "", password: "", roleId: "staff" });
  const [msg, setMsg] = useState("");
  const [crm, setCrm] = useState<CrmContact[]>([]);
  const [crmStats, setCrmStats] = useState({ total: 0, new: 0, customers: 0, orders: 0, inquiries: 0 });
  const [crmForm, setCrmForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [cmsPage, setCmsPage] = useState<"home" | "about" | "contact" | "faq">("home");
  const [homeForm, setHomeForm] = useState({
    heroHeadline: content.heroHeadline,
    heroSubheadline: content.heroSubheadline,
    ctaLabel: content.ctaLabel,
    tagline: content.tagline,
    description: content.description,
    heroImageUrl: content.heroImageUrl || "",
  });
  const [aboutForm, setAboutForm] = useState({ aboutHtml: content.aboutHtml });
  const [contactForm, setContactForm] = useState({
    contactEmail: content.contactEmail,
    contactPhone: content.contactPhone,
    whatsappNumber: content.whatsappNumber || "",
    address: content.address,
    openingHours: content.openingHours || "",
  });
  const [faqs, setFaqs] = useState(content.faqs || []);
  const [settingsForm, setSettingsForm] = useState({
    brandName: content.brandName,
    primaryColor: content.primaryColor || "#0d9488",
    secondaryColor: content.secondaryColor || "#0a1628",
    accentColor: content.accentColor || content.primaryColor || "#0d9488",
    surfaceColor: content.surfaceColor || "#f0fdfa",
    themePalette: (content.themePalette || []).join(", "),
    logoImageUrl: content.logo?.imageUrl || "",
    logoBgFrom: content.logo?.bgFrom || content.primaryColor || "#0d9488",
    logoBgTo: content.logo?.bgTo || "#0a1628",
    logoBadge: content.logo?.badge || content.city || "",
    seoTitle: content.seoTitle || "",
    seoDescription: content.seoDescription || "",
    websiteUrl: "",
  });
  const [themeBusy, setThemeBusy] = useState(false);
  const [websiteBusy, setWebsiteBusy] = useState(false);
  const [contentBusy, setContentBusy] = useState(false);
  const [uploadBusyKey, setUploadBusyKey] = useState<string | null>(null);
  const [themePalette, setThemePalette] = useState<string[]>([]);
  const [themeNotes, setThemeNotes] = useState("");
  const productFileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const logoFileRef = useRef<HTMLInputElement | null>(null);
  const themeFileRef = useRef<HTMLInputElement | null>(null);

  const nav = NAV.filter((n) => !staffOnly || n.staffOk);

  const loadOrders = useCallback(async () => {
    const res = await fetch(`/api/apps/${slug}/admin/orders`);
    if (res.ok) {
      const data = (await res.json()) as { orders: Order[] };
      setOrders(data.orders || []);
    }
  }, [slug]);

  const loadCrm = useCallback(async () => {
    const res = await fetch(`/api/apps/${slug}/admin/crm`);
    if (res.ok) {
      const data = (await res.json()) as {
        contacts: CrmContact[];
        stats: typeof crmStats;
      };
      setCrm(data.contacts || []);
      if (data.stats) setCrmStats(data.stats);
    }
  }, [slug]);

  const loadRoles = useCallback(async () => {
    const res = await fetch(`/api/apps/${slug}/admin/roles`);
    if (res.ok) {
      const data = (await res.json()) as {
        roles: Role[];
        defaultRoleId: string;
        members: Member[];
      };
      setRoles(data.roles || []);
      setDefaultRoleId(data.defaultRoleId);
      setMembers(data.members || []);
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (section === "admin" || section === "admin-orders") {
        await loadOrders();
      }
      if (section === "admin" || section === "admin-crm") {
        await loadCrm();
      }
      if (section === "admin-roles" || section === "admin-customers") {
        await loadRoles();
      }
      if (section === "admin-products" && !cancelled) {
        setProducts(content.products || []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section, slug, content.products, loadOrders, loadCrm, loadRoles]);

  async function patchContent(body: Record<string, unknown>, success = "Saved") {
    setMsg("");
    const res = await fetch(`/api/apps/${slug}/admin/content`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { content?: EcomLocalShopContent; error?: string };
    if (!res.ok) {
      setMsg(data.error || "Save failed");
      return;
    }
    if (data.content) onContentUpdated(data.content);
    setMsg(success);
  }

  async function saveProducts() {
    const cleaned = products
      .map((p, i) => ({
        ...p,
        id: p.id || `p${i + 1}`,
        name: p.name.trim(),
        description: p.description.trim(),
        price: p.price.trim() || "₹0",
        category: p.category.trim() || "General",
      }))
      .filter((p) => p.name);
    // Server fills custom images for any product still missing a photo
    await patchContent({ products: cleaned, autoImages: true }, "Products saved (photos added)");
  }

  async function findImagesForProduct(index: number) {
    const p = products[index];
    if (!p?.name?.trim()) {
      setMsg("Type a product name first, then we can search and build photos.");
      return;
    }
    setImagePicker({ index, loading: true, options: [] });
    setMsg("");
    try {
      const res = await fetch(`/api/apps/${slug}/admin/product-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.name,
          description: p.description,
          category: p.category,
        }),
      });
      const data = (await res.json()) as {
        options?: Array<{ url: string; source: string; label: string }>;
        error?: string;
      };
      if (!res.ok) {
        setMsg(data.error || "Could not find images");
        setImagePicker(null);
        return;
      }
      setImagePicker({
        index,
        loading: false,
        options: data.options || [],
      });
      if (!data.options?.length) {
        setMsg("No images found - try a clearer product name.");
      }
    } catch {
      setMsg("Image search failed. Try again.");
      setImagePicker(null);
    }
  }

  function pickProductImage(url: string) {
    if (!imagePicker) return;
    const next = [...products];
    const i = imagePicker.index;
    next[i] = { ...next[i], image: url };
    setProducts(next);
    setImagePicker(null);
    setMsg("Photo selected - click Save products to keep it.");
  }

  async function uploadProductPhoto(index: number, file: File) {
    setUploadBusyKey(`product-${index}`);
    setMsg("");
    try {
      const url = await uploadAppImage(slug, file, "product");
      const next = [...products];
      next[index] = { ...next[index], image: url };
      setProducts(next);
      setMsg("Your photo was uploaded - click Save products to keep it.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not upload photo");
    } finally {
      setUploadBusyKey(null);
    }
  }

  async function uploadLogoFile(file: File) {
    setUploadBusyKey("logo");
    setMsg("");
    try {
      const url = await uploadAppImage(slug, file, "logo");
      setSettingsForm((f) => ({ ...f, logoImageUrl: url }));
      const palette = await extractPaletteFromImageSource(file);
      setThemePalette(palette);
      setMsg("Logo uploaded. You can pull theme colours from it below.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not upload logo");
    } finally {
      setUploadBusyKey(null);
    }
  }

  async function uploadThemeReference(file: File) {
    setUploadBusyKey("theme-ref");
    setMsg("");
    try {
      await uploadAppImage(slug, file, "theme");
      const palette = await extractPaletteFromImageSource(file);
      setThemePalette(palette);
      setMsg("Theme image loaded. Tap “Build theme from image” to apply colours.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not read theme image");
    } finally {
      setUploadBusyKey(null);
    }
  }

  async function buildThemeFromImage() {
    setThemeBusy(true);
    setMsg("");
    try {
      let palette = themePalette;
      if (palette.length === 0 && settingsForm.logoImageUrl) {
        palette = await extractPaletteFromImageSource(settingsForm.logoImageUrl);
        setThemePalette(palette);
      }
      if (palette.length === 0) {
        setMsg("Upload your logo or a theme photo first, then try again.");
        return;
      }
      const res = await fetch(`/api/apps/${slug}/admin/theme-from-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          palette,
          brandName: settingsForm.brandName,
          city: content.city,
        }),
      });
      const data = (await res.json()) as {
        theme?: {
          primaryColor: string;
          secondaryColor: string;
          accentColor?: string;
          surfaceColor?: string;
          themePalette?: string[];
          logoBgFrom: string;
          logoBgTo: string;
          badge?: string;
          motif?: string;
          notes?: string;
        };
        error?: string;
      };
      if (!res.ok || !data.theme) {
        setMsg(data.error || "Could not build theme");
        return;
      }
      const t = data.theme;
      setSettingsForm((f) => ({
        ...f,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        accentColor: t.accentColor || t.primaryColor,
        surfaceColor: t.surfaceColor || f.surfaceColor,
        themePalette: (t.themePalette || [t.primaryColor, t.secondaryColor]).join(", "),
        logoBgFrom: t.logoBgFrom,
        logoBgTo: t.logoBgTo,
        logoBadge: t.badge || f.logoBadge,
      }));
      setThemeNotes(t.notes || "Multi-colour theme ready - Save to apply on the shop.");
      setMsg("Multi-colour theme filled in - review, then Save brand & theme.");
    } catch {
      setMsg("Theme builder failed. Try another image.");
    } finally {
      setThemeBusy(false);
    }
  }

  async function buildThemeFromWebsite() {
    const websiteUrl = settingsForm.websiteUrl.trim();
    if (!websiteUrl) {
      setMsg("Paste your website link (https://…) first.");
      return;
    }
    setWebsiteBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/apps/${slug}/admin/theme-from-website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl }),
      });
      const data = (await res.json()) as {
        theme?: {
          primaryColor: string;
          secondaryColor: string;
          accentColor?: string;
          surfaceColor?: string;
          themePalette?: string[];
          logoBgFrom: string;
          logoBgTo: string;
          badge?: string;
          notes?: string;
        };
        logoCandidateUrl?: string;
        sampledFrom?: string;
        error?: string;
      };
      if (!res.ok || !data.theme) {
        setMsg(data.error || "Could not read theme from that website");
        return;
      }
      const t = data.theme;
      setSettingsForm((f) => ({
        ...f,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        accentColor: t.accentColor || t.primaryColor,
        surfaceColor: t.surfaceColor || f.surfaceColor,
        themePalette: (t.themePalette || [t.primaryColor, t.secondaryColor]).join(", "),
        logoBgFrom: t.logoBgFrom,
        logoBgTo: t.logoBgTo,
        logoBadge: t.badge || f.logoBadge,
        logoImageUrl: data.logoCandidateUrl || f.logoImageUrl,
      }));
      if (data.theme.themePalette) setThemePalette(data.theme.themePalette);
      setThemeNotes(
        [t.notes, data.sampledFrom ? `Source: ${data.sampledFrom}` : ""]
          .filter(Boolean)
          .join(" · ") || "Theme from website ready - Save brand & theme."
      );
      setMsg(
        data.logoCandidateUrl
          ? "Theme + logo candidate filled from your website - review and Save."
          : "Theme colours filled from your website - review and Save brand & theme."
      );
    } catch {
      setMsg("Website theme failed. Check the link or upload a logo instead.");
    } finally {
      setWebsiteBusy(false);
    }
  }

  async function saveBrandTheme() {
    const palette = settingsForm.themePalette
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter((c) => /^#?[0-9a-fA-F]{3,8}$/.test(c))
      .map((c) => (c.startsWith("#") ? c : `#${c}`));
    await patchContent(
      {
        brandName: settingsForm.brandName,
        primaryColor: settingsForm.primaryColor,
        secondaryColor: settingsForm.secondaryColor,
        accentColor: settingsForm.accentColor,
        surfaceColor: settingsForm.surfaceColor,
        themePalette: palette.length ? palette : undefined,
        logoImageUrl: settingsForm.logoImageUrl,
        logoBgFrom: settingsForm.logoBgFrom,
        logoBgTo: settingsForm.logoBgTo,
        logoBadge: settingsForm.logoBadge,
        seoTitle: settingsForm.seoTitle,
        seoDescription: settingsForm.seoDescription,
      },
      "Brand & multi-colour theme saved - check your shop"
    );
  }

  async function runContentAgent(scope: "all" | "home" | "about" | "faq" | "seo" = "all") {
    setContentBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/apps/${slug}/admin/generate-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, apply: true }),
      });
      const data = (await res.json()) as {
        content?: EcomLocalShopContent;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setMsg(data.error || "Could not improve wording");
        return;
      }
      if (data.content) {
        onContentUpdated(data.content);
        setHomeForm({
          heroHeadline: data.content.heroHeadline,
          heroSubheadline: data.content.heroSubheadline,
          ctaLabel: data.content.ctaLabel,
          tagline: data.content.tagline,
          description: data.content.description,
          heroImageUrl: data.content.heroImageUrl || "",
        });
        setAboutForm({ aboutHtml: data.content.aboutHtml });
        setFaqs(data.content.faqs || []);
        setSettingsForm((f) => ({
          ...f,
          seoTitle: data.content?.seoTitle || f.seoTitle,
          seoDescription: data.content?.seoDescription || f.seoDescription,
        }));
      }
      setMsg(data.message || "Shop wording improved");
    } catch {
      setMsg("Content agent failed. Try again.");
    } finally {
      setContentBusy(false);
    }
  }

  async function inviteMember() {
    setMsg("");
    const res = await fetch(`/api/apps/${slug}/admin/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invite),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMsg(data.error || "Invite failed");
      return;
    }
    setMsg("Team member added");
    setInvite({ email: "", name: "", password: "", roleId: "staff" });
    void loadRoles();
  }

  async function saveRoles() {
    setMsg("");
    const res = await fetch(`/api/apps/${slug}/admin/roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles, defaultRoleId }),
    });
    const data = (await res.json()) as { error?: string; roles?: Role[] };
    if (!res.ok) {
      setMsg(data.error || "Could not save roles");
      return;
    }
    if (data.roles) setRoles(data.roles);
    setMsg("Roles updated");
  }

  async function setOrderStatus(orderId: string, status: string) {
    await fetch(`/api/apps/${slug}/admin/orders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    void loadOrders();
  }

  async function addCrmContact() {
    setMsg("");
    const res = await fetch(`/api/apps/${slug}/admin/crm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(crmForm),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMsg(data.error || "Could not add contact");
      return;
    }
    setCrmForm({ name: "", email: "", phone: "", notes: "" });
    setMsg("Contact added to CRM");
    void loadCrm();
  }

  async function setCrmStage(id: string, stage: string) {
    await fetch(`/api/apps/${slug}/admin/crm`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage }),
    });
    void loadCrm();
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground";
  const label = "mb-1 block text-xs font-medium text-text-secondary";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full bg-background" data-tour="admin-panel">
      {/* Sidebar under global top bar (top bar stays visible to exit admin) */}
      <aside
        data-tour="admin-sidebar"
        className={cn(
          "sticky top-[3.75rem] hidden h-[calc(100vh-3.75rem)] shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300 lg:flex",
          collapsed ? "w-16" : "w-72"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-4">
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{content.brandName}</p>
              <p className="text-[11px] text-text-muted">Shop admin</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-lg border border-border p-1.5 text-text-secondary hover:bg-muted"
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="App admin" data-tour="admin-nav">
          {nav.map((n) => {
            const Icon = n.icon;
            const active =
              section === n.id ||
              (n.id === "admin-cms" &&
                ["admin-cms", "admin-cms-home", "admin-cms-about", "admin-cms-contact", "admin-cms-faq"].includes(
                  section
                ));
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onSection(n.id === "admin-cms" ? "admin-cms" : n.id)}
                data-tour={`admin-nav-${n.id}`}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active ? "shadow-sm" : "text-foreground hover:bg-muted"
                )}
                style={
                  active
                    ? {
                        background: `${accent}18`,
                        color: accent,
                        borderLeft: `3px solid ${accent}`,
                      }
                    : { borderLeft: "3px solid transparent" }
                }
                title={n.label}
              >
                <Icon className="h-4 w-4 shrink-0" style={active ? { color: accent } : undefined} />
                {!collapsed ? (
                  <span className="min-w-0">
                    <span className="block truncate">{n.label}</span>
                    {n.description ? (
                      <span className="block truncate text-[11px] font-normal text-text-muted">
                        {n.description}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border p-3 text-[11px] text-text-muted">
          {!collapsed ? (
            <p>
              Signed in as <strong className="text-foreground">{user.roleLabel}</strong>
              {user.viaPlatformSuperAdmin ? " (platform)" : ""}
            </p>
          ) : null}
        </div>
      </aside>

      {/* Mobile top nav - same pattern as Verlin mobile admin */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className="sticky top-0 z-30 border-b border-border bg-background/95 px-3 py-2 backdrop-blur lg:hidden"
          data-tour="admin-nav-mobile"
        >
          <div className="flex gap-2 overflow-x-auto pb-1">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = section === n.id || (n.id === "admin-cms" && section.startsWith("admin-cms"));
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSection(n.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                    !active && "border-border bg-card"
                  )}
                  style={
                    active
                      ? {
                          borderColor: `${accent}55`,
                          background: `${accent}14`,
                          color: accent,
                        }
                      : undefined
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 pb-16">
          {msg ? (
            <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">{msg}</p>
          ) : null}

          {/* OVERVIEW */}
          {section === "admin" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Overview</h1>
                  <p className="mt-1 text-sm text-text-secondary">
                    Admin home for {content.brandName}. Launch steps follow simple Shopify / Dukaan
                    style checklists.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={contentBusy}
                  data-tour="content-agent"
                  onClick={() => void runContentAgent("all")}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow"
                  style={{ background: accent }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {contentBusy ? "Improving…" : "Improve shop wording"}
                </button>
              </div>
              <p className="text-xs text-text-muted">
                <strong>Improve shop wording</strong> rewrites Home, About, FAQs and Google title /
                description from your products and city - clear, local, and SEO-ready.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Products" value={String(content.products.length)} />
                <Stat label="Orders" value={String(orders.length || crmStats.orders)} />
                <Stat label="CRM contacts" value={String(crmStats.total)} />
                <Stat label="New leads" value={String(crmStats.new)} />
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold">Launch checklist</p>
                <ul className="mt-3 space-y-2">
                  {buildLaunchChecklist({
                    brandName: content.brandName,
                    publicPath: `/apps/${slug}`,
                    answers: [],
                    hasProducts: content.products.length > 0,
                    hasLogo: Boolean(content.logo?.imageUrl || content.logo?.initials),
                  })
                    .slice(0, 6)
                    .map((item) => (
                      <li key={item.id} className="flex gap-2 text-xs text-text-secondary">
                        <CheckCircle2
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: accent }}
                        />
                        <span>
                          <span className="font-medium text-foreground">{item.title}</span>
                          <span className="mt-0.5 block">{item.detail}</span>
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {nav
                  .filter((n) => n.id !== "admin")
                  .map((n) => {
                    const Icon = n.icon;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => onSection(n.id)}
                        className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-accent-teal/40"
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                          style={{ background: accent }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block font-semibold">{n.label}</span>
                          <span className="mt-0.5 block text-xs text-text-secondary">
                            {n.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* SITE CMS - no JSON */}
          {(section === "admin-cms" ||
            section === "admin-cms-home" ||
            section === "admin-cms-about" ||
            section === "admin-cms-contact" ||
            section === "admin-cms-faq") &&
            !staffOnly && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Site CMS</h1>
                    <p className="mt-1 text-sm text-text-secondary">
                      Edit pages, copy, and images - forms only. Or let the content agent improve
                      wording for you.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={contentBusy}
                    onClick={() =>
                      void runContentAgent(
                        cmsPage === "about" ? "about" : cmsPage === "faq" ? "faq" : "home"
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
                  >
                    <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
                    {contentBusy ? "Working…" : "Improve this page wording"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["home", "Home"],
                      ["about", "About"],
                      ["contact", "Contact"],
                      ["faq", "FAQ / Help"],
                    ] as const
                  ).map(([id, labelText]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCmsPage(id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium",
                        cmsPage === id
                          ? "border-transparent text-white"
                          : "border-border bg-card"
                      )}
                      style={cmsPage === id ? { background: accent } : undefined}
                    >
                      <FileText className="mr-1 inline h-3.5 w-3.5" />
                      {labelText}
                    </button>
                  ))}
                </div>

                {cmsPage === "home" && (
                  <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
                    <h2 className="font-semibold">Home page</h2>
                    {(
                      [
                        ["heroHeadline", "Hero headline"],
                        ["heroSubheadline", "Hero subheadline"],
                        ["ctaLabel", "Button label"],
                        ["tagline", "Tagline"],
                        ["description", "Shop description"],
                        ["heroImageUrl", "Hero image link (https://…)"],
                      ] as const
                    ).map(([key, lab]) => (
                      <label key={key} className="block text-sm">
                        <span className={label}>{lab}</span>
                        <input
                          className={field}
                          value={homeForm[key]}
                          onChange={(e) =>
                            setHomeForm((f) => ({ ...f, [key]: e.target.value }))
                          }
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                      style={{ background: accent }}
                      onClick={() =>
                        void patchContent(
                          {
                            heroHeadline: homeForm.heroHeadline,
                            heroSubheadline: homeForm.heroSubheadline,
                            ctaLabel: homeForm.ctaLabel,
                            tagline: homeForm.tagline,
                            description: homeForm.description,
                            heroImageUrl: homeForm.heroImageUrl,
                          },
                          "Home page saved"
                        )
                      }
                    >
                      Save home page
                    </button>
                  </div>
                )}

                {cmsPage === "about" && (
                  <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
                    <h2 className="font-semibold">About page</h2>
                    <label className="block text-sm">
                      <span className={label}>About text (simple paragraphs; you may use &lt;p&gt;)</span>
                      <textarea
                        className={field}
                        rows={8}
                        value={aboutForm.aboutHtml}
                        onChange={(e) => setAboutForm({ aboutHtml: e.target.value })}
                      />
                    </label>
                    <button
                      type="button"
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                      style={{ background: accent }}
                      onClick={() =>
                        void patchContent({ aboutHtml: aboutForm.aboutHtml }, "About page saved")
                      }
                    >
                      Save about page
                    </button>
                  </div>
                )}

                {cmsPage === "contact" && (
                  <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
                    <h2 className="font-semibold">Contact page</h2>
                    {(
                      [
                        ["contactEmail", "Email"],
                        ["contactPhone", "Phone"],
                        ["whatsappNumber", "WhatsApp"],
                        ["address", "Address"],
                        ["openingHours", "Opening hours"],
                      ] as const
                    ).map(([key, lab]) => (
                      <label key={key} className="block text-sm">
                        <span className={label}>{lab}</span>
                        <input
                          className={field}
                          value={contactForm[key]}
                          onChange={(e) =>
                            setContactForm((f) => ({ ...f, [key]: e.target.value }))
                          }
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                      style={{ background: accent }}
                      onClick={() => void patchContent(contactForm, "Contact page saved")}
                    >
                      Save contact page
                    </button>
                  </div>
                )}

                {cmsPage === "faq" && (
                  <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
                    <h2 className="font-semibold">FAQ / Help</h2>
                    {faqs.map((f, i) => (
                      <div key={i} className="space-y-2 rounded-xl border border-border p-3">
                        <input
                          className={field}
                          placeholder="Question"
                          value={f.question}
                          onChange={(e) => {
                            const next = [...faqs];
                            next[i] = { ...f, question: e.target.value };
                            setFaqs(next);
                          }}
                        />
                        <textarea
                          className={field}
                          rows={2}
                          placeholder="Answer"
                          value={f.answer}
                          onChange={(e) => {
                            const next = [...faqs];
                            next[i] = { ...f, answer: e.target.value };
                            setFaqs(next);
                          }}
                        />
                        <button
                          type="button"
                          className="text-xs text-red-600"
                          onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="rounded-xl border border-border px-3 py-2 text-sm"
                      onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                    >
                      + Add FAQ
                    </button>
                    <button
                      type="button"
                      className="ml-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                      style={{ background: accent }}
                      onClick={() =>
                        void patchContent(
                          {
                            faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
                          },
                          "FAQ saved"
                        )
                      }
                    >
                      Save FAQ page
                    </button>
                  </div>
                )}
              </div>
            )}

          {/* CRM */}
          {section === "admin-crm" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">CRM</h1>
                <p className="mt-1 text-sm text-text-secondary">
                  Customers and contacts for this shop - always included with every app.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Stat label="Contacts" value={String(crmStats.total)} />
                <Stat label="New" value={String(crmStats.new)} />
                <Stat label="Customers" value={String(crmStats.customers)} />
                <Stat label="Orders" value={String(crmStats.orders)} />
              </div>
              <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
                <h2 className="sm:col-span-2 font-semibold">Add contact</h2>
                <input
                  className={field}
                  placeholder="Name"
                  value={crmForm.name}
                  onChange={(e) => setCrmForm((f) => ({ ...f, name: e.target.value }))}
                />
                <input
                  className={field}
                  placeholder="Email"
                  value={crmForm.email}
                  onChange={(e) => setCrmForm((f) => ({ ...f, email: e.target.value }))}
                />
                <input
                  className={field}
                  placeholder="Phone"
                  value={crmForm.phone}
                  onChange={(e) => setCrmForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <input
                  className={field}
                  placeholder="Notes"
                  value={crmForm.notes}
                  onChange={(e) => setCrmForm((f) => ({ ...f, notes: e.target.value }))}
                />
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white sm:col-span-2"
                  style={{ background: accent }}
                  onClick={() => void addCrmContact()}
                >
                  Add to CRM
                </button>
              </div>
              <ul className="space-y-2">
                {crm.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    No contacts yet. Sign-ups, orders, and messages appear here automatically.
                  </p>
                ) : (
                  crm.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold">
                          {c.name} · {c.email}
                        </p>
                        <p className="text-xs text-text-muted">
                          {c.source} · orders {c.orderCount}
                          {c.phone ? ` · ${c.phone}` : ""}
                          {c.notes ? ` · ${c.notes}` : ""}
                        </p>
                      </div>
                      <select
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        value={c.stage}
                        onChange={(e) => void setCrmStage(c.id, e.target.value)}
                      >
                        {["new", "contacted", "customer", "inactive"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {/* ORDERS */}
          {section === "admin-orders" && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Orders</h1>
              {orders.length === 0 ? (
                <p className="text-sm text-text-secondary">No orders yet.</p>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {o.customerName} · {o.customerEmail}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(o.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <select
                        className="rounded-lg border border-border bg-background px-2 py-1"
                        value={o.status}
                        onChange={(e) => void setOrderStatus(o.id, e.target.value)}
                      >
                        {["new", "confirmed", "fulfilled", "cancelled"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <ul className="mt-2 list-inside list-disc text-text-secondary">
                      {o.items.map((it, idx) => (
                        <li key={idx}>
                          {it.qty}× {it.name} - {it.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PRODUCTS - upload own photos, search web, or AI images */}
          {section === "admin-products" && !staffOnly && (
            <div className="space-y-4" data-tour="admin-products">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-semibold">Products</h1>
                  <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                    Add each product, then add a photo in any of three ways:{" "}
                    <strong>upload your own</strong>, <strong>paste a link</strong>, or{" "}
                    <strong>Find photos</strong> (web search + custom AI). Saving also auto-adds
                    photos for any product still missing one.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-border px-3 py-2 text-sm"
                  onClick={() => setProducts((p) => [...p, emptyProduct()])}
                >
                  + Add product
                </button>
              </div>
              {products.map((p, i) => (
                <div key={p.id || i} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap gap-3">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-text-muted">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className={label}>Name</span>
                          <input
                            className={field}
                            value={p.name}
                            onChange={(e) => {
                              const next = [...products];
                              next[i] = { ...p, name: e.target.value };
                              setProducts(next);
                            }}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className={label}>Price</span>
                          <input
                            className={field}
                            value={p.price}
                            onChange={(e) => {
                              const next = [...products];
                              next[i] = { ...p, price: e.target.value };
                              setProducts(next);
                            }}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className={label}>Category</span>
                          <input
                            className={field}
                            value={p.category}
                            onChange={(e) => {
                              const next = [...products];
                              next[i] = { ...p, category: e.target.value };
                              setProducts(next);
                            }}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className={label}>Photo link (optional)</span>
                          <input
                            className={field}
                            value={p.image || ""}
                            onChange={(e) => {
                              const next = [...products];
                              next[i] = { ...p, image: e.target.value };
                              setProducts(next);
                            }}
                            placeholder="https://… or upload below"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <label className="block text-sm">
                    <span className={label}>Description (helps find better photos)</span>
                    <textarea
                      className={field}
                      rows={2}
                      value={p.description}
                      onChange={(e) => {
                        const next = [...products];
                        next[i] = { ...p, description: e.target.value };
                        setProducts(next);
                      }}
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2">
                    <ImagePlus className="h-4 w-4 shrink-0 text-text-muted" />
                    <span className="text-xs font-medium text-text-secondary">Photo:</span>
                    <input
                      ref={(el) => {
                        productFileRefs.current[i] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadProductPhoto(i, file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
                      disabled={uploadBusyKey === `product-${i}`}
                      onClick={() => productFileRefs.current[i]?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploadBusyKey === `product-${i}` ? "Uploading…" : "Upload your photo"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                      style={{ background: accent }}
                      onClick={() => void findImagesForProduct(i)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Find photos
                    </button>
                    {p.image ? (
                      <button
                        type="button"
                        className="text-xs text-text-muted underline"
                        onClick={() => {
                          const next = [...products];
                          next[i] = { ...p, image: undefined };
                          setProducts(next);
                        }}
                      >
                        Clear photo
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(p.featured)}
                        onChange={(e) => {
                          const next = [...products];
                          next[i] = { ...p, featured: e.target.checked };
                          setProducts(next);
                        }}
                      />
                      Featured on home
                    </label>
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() => setProducts(products.filter((_, j) => j !== i))}
                    >
                      Remove product
                    </button>
                  </div>

                  {imagePicker?.index === i ? (
                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                      <p className="mb-2 text-xs font-semibold text-foreground">
                        {imagePicker.loading
                          ? "Searching the web and building custom photos…"
                          : "Tap a photo to use it"}
                      </p>
                      {imagePicker.loading ? (
                        <p className="text-xs text-text-muted">Please wait a few seconds…</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {imagePicker.options.map((opt) => (
                            <button
                              key={opt.url}
                              type="button"
                              onClick={() => pickProductImage(opt.url)}
                              className="group overflow-hidden rounded-xl border border-border bg-card text-left hover:border-accent-teal"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={opt.url}
                                alt=""
                                className="aspect-square w-full object-cover"
                                loading="lazy"
                              />
                              <span className="block truncate px-1.5 py-1 text-[10px] text-text-muted">
                                {opt.source === "custom" ? "Custom" : "Web"} · {opt.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {!imagePicker.loading ? (
                        <button
                          type="button"
                          className="mt-2 text-xs text-text-muted underline"
                          onClick={() => setImagePicker(null)}
                        >
                          Close
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: accent }}
                onClick={() => void saveProducts()}
              >
                Save products
              </button>
            </div>
          )}

          {/* ROLES */}
          {section === "admin-roles" && !staffOnly && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Role Assignment</h1>
              <p className="text-sm text-text-secondary">
                Same idea as Verlin Labs roles - for this shop only.
              </p>
              <label className="block text-sm">
                <span className={label}>Default role for new sign-ups</span>
                <select
                  className={field}
                  value={defaultRoleId}
                  onChange={(e) => setDefaultRoleId(e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              {roles.map((r, idx) => (
                <div key={r.id} className="space-y-2 rounded-xl border border-border p-4">
                  <input
                    className={field}
                    value={r.label}
                    disabled={r.id === "super_admin"}
                    onChange={(e) => {
                      const next = [...roles];
                      next[idx] = { ...r, label: e.target.value };
                      setRoles(next);
                    }}
                  />
                  <textarea
                    className={field}
                    rows={2}
                    value={r.description}
                    onChange={(e) => {
                      const next = [...roles];
                      next[idx] = { ...r, description: e.target.value };
                      setRoles(next);
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: accent }}
                onClick={() => void saveRoles()}
              >
                Save roles
              </button>
            </div>
          )}

          {/* TEAM */}
          {section === "admin-customers" && !staffOnly && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Team</h1>
              <ul className="space-y-2 text-sm">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap justify-between gap-2 rounded-xl border border-border p-3"
                  >
                    <span>
                      <strong>{m.name}</strong> · {m.email}
                    </span>
                    <span className="text-text-muted">{m.roleId}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 rounded-xl border border-border p-4">
                <h2 className="font-semibold">Add team member</h2>
                <input
                  className={field}
                  placeholder="Name"
                  value={invite.name}
                  onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  className={field}
                  placeholder="Email"
                  value={invite.email}
                  onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))}
                />
                <input
                  className={field}
                  type="password"
                  placeholder="Temporary password (8+)"
                  value={invite.password}
                  onChange={(e) => setInvite((p) => ({ ...p, password: e.target.value }))}
                />
                <select
                  className={field}
                  value={invite.roleId}
                  onChange={(e) => setInvite((p) => ({ ...p, roleId: e.target.value }))}
                >
                  {roles
                    .filter((r) => r.id !== "customer")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: accent }}
                  onClick={() => void inviteMember()}
                >
                  Add member
                </button>
              </div>
            </div>
          )}

          {/* BRAND & THEME */}
          {section === "admin-settings" && !staffOnly && (
            <div className="space-y-6" data-tour="admin-settings">
              <div>
                <h1 className="text-2xl font-semibold">Brand & theme</h1>
                <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                  Upload your logo <strong>and/or paste your website link</strong> to pull multi-colour
                  theme colours. Colours apply to buttons, nav, and logo backgrounds. Clicking your
                  logo on the live app always returns to Home.
                </p>
              </div>

              <label className="block text-sm">
                <span className={label}>Shop / brand name</span>
                <input
                  className={field}
                  value={settingsForm.brandName}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, brandName: e.target.value }))
                  }
                />
              </label>

              <div
                className="rounded-2xl border border-border bg-card p-4 space-y-3"
                data-tour="admin-website"
              >
                <p className="text-sm font-semibold">0. Your existing website (optional)</p>
                <p className="text-xs text-text-secondary">
                  Paste your live site (https://…). We sample brand colours and try to find a logo
                  image for you - same multi-colour theme as logo upload.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    className={cn(field, "min-w-[16rem] flex-1")}
                    value={settingsForm.websiteUrl}
                    onChange={(e) =>
                      setSettingsForm((f) => ({ ...f, websiteUrl: e.target.value }))
                    }
                    placeholder="https://www.yourbrand.com"
                    inputMode="url"
                    autoComplete="url"
                  />
                  <button
                    type="button"
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
                    style={{ background: accent }}
                    disabled={websiteBusy}
                    onClick={() => void buildThemeFromWebsite()}
                  >
                    {websiteBusy ? "Reading site…" : "Pull theme from website"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold">1. Your logo</p>
                <p className="text-xs text-text-secondary">
                  Upload a square logo (PNG or JPG), or paste a logo image link. Website pull may
                  fill this automatically.
                </p>
                <div className="flex flex-wrap items-start gap-4">
                  <div
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border shadow"
                    style={{
                      background: `linear-gradient(145deg, ${settingsForm.logoBgFrom}, ${settingsForm.logoBgTo})`,
                    }}
                  >
                    {settingsForm.logoImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settingsForm.logoImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {(settingsForm.brandName || "SH").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadLogoFile(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium"
                      disabled={uploadBusyKey === "logo"}
                      onClick={() => logoFileRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {uploadBusyKey === "logo" ? "Uploading…" : "Upload logo"}
                    </button>
                    <label className="block text-sm">
                      <span className={label}>Or logo image link</span>
                      <input
                        className={field}
                        value={settingsForm.logoImageUrl}
                        onChange={(e) =>
                          setSettingsForm((f) => ({ ...f, logoImageUrl: e.target.value }))
                        }
                        placeholder="https://…"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 space-y-3" data-tour="admin-theme">
                <p className="text-sm font-semibold">2. Theme from your logo or a mood photo</p>
                <ol className="list-decimal space-y-1 pl-4 text-xs text-text-secondary">
                  <li>Upload your logo (above) - or upload a separate photo that matches your brand look.</li>
                  <li>Tap <strong>Build theme from image</strong> - we sample colours and refine them.</li>
                  <li>Tweak colours if you like, then <strong>Save brand & theme</strong>.</li>
                </ol>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={themeFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadThemeReference(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium"
                    disabled={uploadBusyKey === "theme-ref"}
                    onClick={() => themeFileRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    {uploadBusyKey === "theme-ref" ? "Reading…" : "Upload theme photo"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white"
                    style={{ background: accent }}
                    disabled={themeBusy}
                    onClick={() => void buildThemeFromImage()}
                  >
                    <Palette className="h-4 w-4" />
                    {themeBusy ? "Building…" : "Build theme from image"}
                  </button>
                </div>
                {themePalette.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-text-muted">Sampled:</span>
                    {themePalette.map((c) => (
                      <span
                        key={c}
                        className="h-7 w-7 rounded-lg border border-border shadow-sm"
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>
                ) : null}
                {themeNotes ? (
                  <p className="text-xs text-text-secondary">{themeNotes}</p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className={label}>Main colour (buttons)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border border-border"
                      value={settingsForm.primaryColor || "#0d9488"}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, primaryColor: e.target.value }))
                      }
                    />
                    <input
                      className={field}
                      value={settingsForm.primaryColor}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, primaryColor: e.target.value }))
                      }
                    />
                  </div>
                </label>
                <label className="block text-sm">
                  <span className={label}>Secondary colour (depth / headers)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border border-border"
                      value={settingsForm.secondaryColor || "#0a1628"}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, secondaryColor: e.target.value }))
                      }
                    />
                    <input
                      className={field}
                      value={settingsForm.secondaryColor}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, secondaryColor: e.target.value }))
                      }
                    />
                  </div>
                </label>
                <label className="block text-sm">
                  <span className={label}>Accent colour (prices, badges)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border border-border"
                      value={settingsForm.accentColor || "#0d9488"}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, accentColor: e.target.value }))
                      }
                    />
                    <input
                      className={field}
                      value={settingsForm.accentColor}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, accentColor: e.target.value }))
                      }
                    />
                  </div>
                </label>
                <label className="block text-sm">
                  <span className={label}>Surface wash (soft backgrounds)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border border-border"
                      value={settingsForm.surfaceColor || "#f0fdfa"}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, surfaceColor: e.target.value }))
                      }
                    />
                    <input
                      className={field}
                      value={settingsForm.surfaceColor}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, surfaceColor: e.target.value }))
                      }
                    />
                  </div>
                </label>
                <label className="block text-sm">
                  <span className={label}>Logo background (from)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border border-border"
                      value={settingsForm.logoBgFrom}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, logoBgFrom: e.target.value }))
                      }
                    />
                    <input
                      className={field}
                      value={settingsForm.logoBgFrom}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, logoBgFrom: e.target.value }))
                      }
                    />
                  </div>
                </label>
                <label className="block text-sm">
                  <span className={label}>Logo background (to)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border border-border"
                      value={settingsForm.logoBgTo}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, logoBgTo: e.target.value }))
                      }
                    />
                    <input
                      className={field}
                      value={settingsForm.logoBgTo}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, logoBgTo: e.target.value }))
                      }
                    />
                  </div>
                </label>
              </div>

              <label className="block text-sm">
                <span className={label}>Full colour palette (comma-separated hex)</span>
                <input
                  className={field}
                  value={settingsForm.themePalette}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, themePalette: e.target.value }))
                  }
                  placeholder="#c2410c, #9a3412, #ea580c, #7c2d12"
                />
                <span className="mt-1 block text-[11px] text-text-muted">
                  Used across chips, product cards, hero ribbon, and footer - not one colour only.
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className={label}>Google / share title (SEO)</span>
                  <input
                    className={field}
                    value={settingsForm.seoTitle}
                    onChange={(e) =>
                      setSettingsForm((f) => ({ ...f, seoTitle: e.target.value }))
                    }
                    placeholder="Brand · City | Offer"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className={label}>Google / share description (SEO)</span>
                  <textarea
                    className={field}
                    rows={2}
                    value={settingsForm.seoDescription}
                    onChange={(e) =>
                      setSettingsForm((f) => ({ ...f, seoDescription: e.target.value }))
                    }
                    placeholder="What you sell, city, how to order…"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className={label}>Short badge under logo (e.g. city · craft)</span>
                <input
                  className={field}
                  value={settingsForm.logoBadge}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, logoBadge: e.target.value }))
                  }
                  placeholder={`${content.city} · Shop`}
                />
              </label>

              <div
                className="rounded-xl border border-border p-4 text-white"
                style={{
                  background: `linear-gradient(135deg, ${settingsForm.primaryColor}, ${settingsForm.secondaryColor})`,
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-white/80">
                  Multi-colour preview
                </p>
                <p className="mt-1 text-lg font-semibold">{settingsForm.brandName || "Your shop"}</p>
                <p className="text-sm text-white/90">{settingsForm.logoBadge || content.city}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    settingsForm.primaryColor,
                    settingsForm.secondaryColor,
                    settingsForm.accentColor,
                    settingsForm.logoBgFrom,
                    settingsForm.logoBgTo,
                    ...settingsForm.themePalette.split(/[\s,]+/).filter(Boolean),
                  ]
                    .filter((c, i, a) => a.indexOf(c) === i)
                    .slice(0, 8)
                    .map((c) => (
                      <span
                        key={c}
                        className="h-6 w-6 rounded-md border border-white/40 shadow"
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ background: settingsForm.primaryColor, color: "#fff" }}
                  >
                    Primary CTA
                  </button>
                  <span
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ color: settingsForm.accentColor, background: "#fff" }}
                  >
                    ₹999 accent price
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ background: settingsForm.primaryColor || accent }}
                onClick={() => void saveBrandTheme()}
              >
                Save brand & theme
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
