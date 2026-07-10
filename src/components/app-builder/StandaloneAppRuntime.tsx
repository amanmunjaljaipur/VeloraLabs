"use client";

import { AppAdminPanel } from "@/components/app-builder/AppAdminPanel";
import { AppAuthScreens } from "@/components/app-builder/AppAuthScreens";
import { AppBuilderFooter } from "@/components/app-builder/AppBuilderFooter";
import {
  AppGuidedTour,
  AppTourReplayButton,
} from "@/components/app-builder/AppGuidedTour";
import { EcomLocalShopApp } from "@/components/app-builder/EcomLocalShopApp";
import { GenericAppRuntime } from "@/components/app-builder/GenericAppRuntime";
import { resolveShopTheme, withAlpha } from "@/lib/app-builder/shop-theme";
import type { AppExtensionContent, EcomLocalShopContent } from "@/lib/app-builder/types";
import { isEcomContent, isGenericContent } from "@/lib/app-builder/types";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export type AppRoute =
  | "home"
  | "shop"
  | "about"
  | "faq"
  | "contact"
  | "login"
  | "signup"
  | "account"
  | "admin"
  | "admin-cms"
  | "admin-cms-home"
  | "admin-cms-about"
  | "admin-cms-contact"
  | "admin-cms-faq"
  | "admin-crm"
  | "admin-products"
  | "admin-orders"
  | "admin-customers"
  | "admin-roles"
  | "admin-settings";

const SYSTEM_SEGMENTS = new Set([
  "login",
  "signup",
  "account",
  "admin",
  "shop",
  "about",
  "faq",
  "contact",
  "home",
]);

function parseRoute(segments: string[]): AppRoute {
  const a = segments[0] || "home";
  if (a === "login") return "login";
  if (a === "signup") return "signup";
  if (a === "account") return "account";
  if (a === "admin") {
    const b = segments[1];
    if (b === "cms") return "admin-cms";
    if (b === "crm") return "admin-crm";
    if (b === "products") return "admin-products";
    if (b === "orders") return "admin-orders";
    if (b === "customers" || b === "team") return "admin-customers";
    if (b === "roles") return "admin-roles";
    if (b === "settings") return "admin-settings";
    return "admin";
  }
  if (a === "shop" || a === "about" || a === "faq" || a === "contact") return a;
  // Generic app pages (dashboard, products, apply, …) still use home shell for admin chrome
  return "home";
}

/** Public page slug from URL (supports multi-page generic apps, Verlin-style paths) */
function parsePublicPage(segments: string[]): string {
  const a = segments[0];
  if (!a || a === "home") return "home";
  if (SYSTEM_SEGMENTS.has(a) && a !== "shop" && a !== "about" && a !== "faq" && a !== "contact") {
    return "home";
  }
  if (a === "admin" || a === "login" || a === "signup" || a === "account") return "home";
  return a.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "home";
}

function routeToPath(basePath: string, route: AppRoute): string {
  const map: Record<AppRoute, string> = {
    home: basePath,
    shop: `${basePath}/shop`,
    about: `${basePath}/about`,
    faq: `${basePath}/faq`,
    contact: `${basePath}/contact`,
    login: `${basePath}/login`,
    signup: `${basePath}/signup`,
    account: `${basePath}/account`,
    admin: `${basePath}/admin`,
    "admin-cms": `${basePath}/admin/cms`,
    "admin-cms-home": `${basePath}/admin/cms`,
    "admin-cms-about": `${basePath}/admin/cms`,
    "admin-cms-contact": `${basePath}/admin/cms`,
    "admin-cms-faq": `${basePath}/admin/cms`,
    "admin-crm": `${basePath}/admin/crm`,
    "admin-products": `${basePath}/admin/products`,
    "admin-orders": `${basePath}/admin/orders`,
    "admin-customers": `${basePath}/admin/team`,
    "admin-roles": `${basePath}/admin/roles`,
    "admin-settings": `${basePath}/admin/settings`,
  };
  return map[route];
}

function publicPageToPath(basePath: string, page: string): string {
  const p = page.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "home";
  if (p === "home") return basePath;
  return `${basePath}/${p}`;
}

export interface AppUserView {
  email: string;
  name: string;
  roleId: string;
  roleLabel: string;
  isStaff: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  viaPlatformSuperAdmin?: boolean;
}

export function StandaloneAppRuntime({
  content: initialContent,
  basePath,
  slug,
  pathSegments = [],
}: {
  content: AppExtensionContent;
  basePath: string;
  slug: string;
  pathSegments?: string[];
}) {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(pathSegments));
  const [publicPage, setPublicPage] = useState(() => parsePublicPage(pathSegments));
  const [content, setContent] = useState<AppExtensionContent>(initialContent);
  const [user, setUser] = useState<AppUserView | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [forceTour, setForceTour] = useState(false);

  const theme = resolveShopTheme({
    primaryColor: content.primaryColor,
    secondaryColor: content.secondaryColor,
    accentColor: content.accentColor,
    surfaceColor: "surfaceColor" in content ? content.surfaceColor : undefined,
    themePalette: content.themePalette,
    logo: content.logo,
  });
  const accent = theme.primary;
  const brandName = content.brandName;
  const city = "city" in content && content.city ? content.city : "";

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${slug}/auth/me`);
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: AppUserView | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/apps/${slug}/auth/me`);
        if (cancelled) return;
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = (await res.json()) as { user: AppUserView | null };
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const go = useCallback(
    (next: AppRoute) => {
      setRoute(next);
      if (next === "home") setPublicPage("home");
      if (next === "shop" || next === "about" || next === "faq" || next === "contact") {
        setPublicPage(next);
      }
      const url = routeToPath(basePath, next);
      if (typeof window !== "undefined") {
        window.history.pushState({ appRoute: next, publicPage: next }, "", url);
      }
    },
    [basePath]
  );

  /** Navigate to any public page path (generic apps + Verlin-style logo → home) */
  const goPage = useCallback(
    (page: string) => {
      const p = page.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "home";
      setPublicPage(p);
      // Map known ecom routes so AppRoute stays in sync
      if (p === "home" || p === "shop" || p === "about" || p === "faq" || p === "contact") {
        setRoute(p);
      } else {
        setRoute("home");
      }
      const url = publicPageToPath(basePath, p);
      if (typeof window !== "undefined") {
        window.history.pushState({ appRoute: "home", publicPage: p }, "", url);
      }
      // Scroll to top like a real nav click (Verlin Labs pattern)
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [basePath]
  );

  useEffect(() => {
    const onPop = () => {
      if (typeof window === "undefined") return;
      const path = window.location.pathname.replace(/\/$/, "");
      const base = basePath.replace(/\/$/, "");
      const rest = path.startsWith(base) ? path.slice(base.length).replace(/^\//, "") : "";
      const segs = rest.split("/").filter(Boolean);
      setRoute(parseRoute(segs));
      setPublicPage(parsePublicPage(segs));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [basePath]);

  async function handleLogout() {
    await fetch(`/api/apps/${slug}/auth/logout`, { method: "POST" });
    setUser(null);
    go("home");
  }

  const shopPathSeg = useMemo(() => {
    if (route === "shop") return ["shop"];
    if (route === "about") return ["about"];
    if (route === "faq") return ["faq"];
    if (route === "contact") return ["contact"];
    return [];
  }, [route]);

  const isAdminRoute = route.startsWith("admin");
  const isAuthRoute = route === "login" || route === "signup";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground" data-app-standalone="true">
      {/* Always-visible top bar — works in shop AND admin so you can leave admin */}
      <header
        className="sticky top-0 z-[60] border-b border-border bg-card shadow-sm"
        data-tour="header"
      >
        <div className="mx-auto flex w-full max-w-[100vw] flex-wrap items-center justify-between gap-3 px-4 py-3">
          {/* Logo + brand name → always home (same idea as Verlin Labs VerlinLogo → /) */}
          <button
            type="button"
            onClick={() => goPage("home")}
            className="group flex items-center gap-2 text-left transition-opacity hover:opacity-90"
            data-tour="brand"
            aria-label={`${brandName} home`}
            title="Go to home"
          >
            {content.logo?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.logo.imageUrl}
                alt={`${brandName} logo`}
                className="h-9 w-9 rounded-xl object-cover shadow"
              />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow"
                style={{
                  background: `linear-gradient(145deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                }}
              >
                {content.logo?.initials || brandName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span>
              <span className="block text-sm font-semibold" style={{ color: theme.primary }}>
                {brandName}
              </span>
              <span className="block text-[10px] text-text-muted">
                {isAdminRoute ? "Admin · " : ""}
                {city || content.tagline?.slice(0, 24)}
              </span>
            </span>
          </button>

          {/* Public pages — full IA for generic apps; ecom keeps shop links */}
          <nav
            className="flex max-w-full flex-wrap items-center gap-1 text-sm font-medium"
            aria-label="App pages"
            data-tour="nav"
          >
            {isEcomContent(content)
              ? (
                  [
                    ["home", "Home", Home],
                    ["shop", "Products", ShoppingBag],
                    ["about", "About", Store],
                    ["contact", "Contact", ExternalLink],
                  ] as const
                ).map(([r, label, Icon]) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => goPage(r)}
                    data-tour={`nav-${r}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5"
                    style={
                      publicPage === r && !isAdminRoute
                        ? { background: withAlpha(theme.primary, 0.12), color: theme.primary }
                        : undefined
                    }
                  >
                    <Icon className="hidden h-3.5 w-3.5 sm:inline" />
                    {label}
                  </button>
                ))
              : isGenericContent(content)
                ? (
                    content.nav?.length
                      ? content.nav
                      : content.pages.map((p) => ({ path: p.path, label: p.title }))
                  )
                    .filter((n, i, arr) => arr.findIndex((x) => x.path === n.path) === i)
                    .slice(0, 12)
                    .map((n) => (
                      <button
                        key={n.path}
                        type="button"
                        onClick={() => goPage(n.path)}
                        data-tour={`nav-${n.path}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5"
                        style={
                          publicPage === n.path && !isAdminRoute
                            ? {
                                background: withAlpha(theme.primary, 0.12),
                                color: theme.primary,
                              }
                            : undefined
                        }
                      >
                        {n.label}
                      </button>
                    ))
                : null}
          </nav>

          <div className="flex flex-wrap items-center gap-2 text-sm" data-tour="auth-actions">
            {/* Always available — shop and admin can replay overlay tour */}
            <AppTourReplayButton accent={accent} onClick={() => setForceTour(true)} />
            {isAdminRoute ? (
              <button
                type="button"
                onClick={() => goPage("home")}
                data-tour="back-to-shop"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  color: theme.onPrimary,
                }}
              >
                <Store className="h-3.5 w-3.5" />
                {isEcomContent(content) ? "Back to shop" : "Back to site"}
              </button>
            ) : null}
            {user?.isAdmin || user?.isStaff ? (
              <button
                type="button"
                onClick={() => go("admin")}
                data-tour="dashboard"
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium hover:bg-muted",
                  isAdminRoute && "bg-muted"
                )}
                style={{ color: theme.secondary }}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
            ) : null}
            {authLoading ? (
              <span className="text-xs text-text-muted">…</span>
            ) : user ? (
              <>
                <button
                  type="button"
                  onClick={() => go("account")}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 hover:bg-muted"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[8rem] truncate">{user.name || user.email}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-text-muted hover:bg-muted"
                  title="Sign out of this shop only"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => go("login")}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 hover:bg-muted"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => go("signup")}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold"
                  style={{ background: theme.primary, color: theme.onPrimary }}
                >
                  Join
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tour stays mounted across pages (including login/admin steps) */}
      <AppGuidedTour
        slug={slug}
        brandName={content.brandName}
        accent={accent}
        includeAdmin={Boolean(user?.isAdmin || user?.isStaff)}
        onNavigate={go}
        forceOpen={forceTour}
        onCloseForce={() => setForceTour(false)}
      />

      {user?.viaPlatformSuperAdmin ? (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-900 dark:text-amber-100">
          You are viewing as platform Super Admin with Owner access on this shop.
        </div>
      ) : null}

      {isAuthRoute ? (
        <AppAuthScreens
          slug={slug}
          brandName={content.brandName}
          city={content.city}
          tagline={content.tagline}
          logo={content.logo}
          accent={accent}
          mode={route === "signup" ? "signup" : "login"}
          publicPath={basePath}
          onSuccess={() => {
            void loadMe().then(() => {
              // After login: staff/admin → dashboard, customers → shop home
              void fetch(`/api/apps/${slug}/auth/me`)
                .then((r) => r.json())
                .then((data: { user?: AppUserView | null }) => {
                  if (data.user?.isAdmin || data.user?.isStaff) go("admin");
                  else go("home");
                })
                .catch(() => go("home"));
            });
          }}
          onSwitch={(mode) => go(mode === "signup" ? "signup" : "login")}
          onBrowseShop={() => go("home")}
        />
      ) : null}

      {isAdminRoute && user?.isAdmin && isEcomContent(content) ? (
        <AppAdminPanel
          slug={slug}
          content={content}
          accent={accent}
          user={user}
          section={route}
          onSection={go}
          onContentUpdated={setContent}
        />
      ) : null}

      {isAdminRoute && user && !user.isAdmin && user.isStaff && isEcomContent(content) ? (
        <AppAdminPanel
          slug={slug}
          content={content}
          accent={accent}
          user={user}
          section={route === "admin" ? "admin-orders" : route}
          onSection={go}
          onContentUpdated={setContent}
          staffOnly
        />
      ) : null}

      {isAdminRoute && user?.isAdmin && isGenericContent(content) ? (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-lg font-semibold">Dashboard for this product</p>
          <p className="mt-2 text-sm text-text-secondary">
            Full CMS for non-shop apps is rolling out. Use Site wording improvements from the builder
            for now, or edit after export. Your live app is available via the top menu.
          </p>
          <button
            type="button"
            onClick={() => go("home")}
            className="mt-6 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: accent }}
          >
            Back to app
          </button>
        </div>
      ) : null}

      {isAdminRoute && !user?.isAdmin && !user?.isStaff ? (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-lg font-semibold">Admin access required</p>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in with an Owner, Manager, or Staff account for this shop.
          </p>
          <button
            type="button"
            onClick={() => go("login")}
            className="mt-6 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: accent }}
          >
            Sign in
          </button>
        </div>
      ) : null}

      {route === "account" && user ? (
        <div className="mx-auto max-w-lg space-y-4 px-4 py-10">
          <h1 className="text-2xl font-semibold">My account</h1>
          <div className="rounded-2xl border border-border bg-card p-5 text-sm">
            <p>
              <span className="text-text-muted">Name:</span> {user.name}
            </p>
            <p className="mt-2">
              <span className="text-text-muted">Email:</span> {user.email}
            </p>
            <p className="mt-2">
              <span className="text-text-muted">Role:</span> {user.roleLabel}
            </p>
          </div>
          <p className="text-xs text-text-muted">
            This account is only for <strong>{content.brandName}</strong> — separate from any other
            website logins.
          </p>
          <button
            type="button"
            onClick={() => go("shop")}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: accent }}
          >
            <ShoppingBag className="h-4 w-4" />
            Continue shopping
          </button>
        </div>
      ) : null}

      {route === "account" && !user && !authLoading ? (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="font-semibold">Please sign in</p>
          <button
            type="button"
            onClick={() => go("login")}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: accent }}
          >
            Sign in
          </button>
        </div>
      ) : null}

      {!isAuthRoute && !isAdminRoute && route !== "account" && isEcomContent(content) ? (
        <EcomLocalShopApp
          content={content}
          basePath={basePath}
          pathSegments={shopPathSeg}
          embedded
          onNavigate={(page) => {
            if (page === "home") go("home");
            else if (page === "shop" || page === "about" || page === "faq" || page === "contact") {
              go(page);
            }
          }}
          slug={slug}
          appUser={user}
        />
      ) : null}

      {!isAuthRoute && !isAdminRoute && route !== "account" && isGenericContent(content) ? (
        <GenericAppRuntime
          content={content}
          pathSegments={[publicPage === "home" ? "" : publicPage].filter(Boolean)}
          embedded
          activePage={publicPage}
          onNavigate={(page) => goPage(page)}
        />
      ) : null}

      {/* Footer on account / auth pages (shop pages include their own footer) */}
      {(isAuthRoute || route === "account") && !isAdminRoute && isEcomContent(content) ? (
        <AppBuilderFooter content={content} theme={theme} onNavigate={(p) => goPage(p)} />
      ) : null}
    </div>
  );
}
