"use client";

import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { BUILDER_TEMPLATES, type BuilderTemplateId } from "@/lib/cms/block-registry";
import type { CmsPageDefinition } from "@/lib/cms/registry";
import { PageLoader } from "@/components/ui/PageLoader";
import { FileText, LayoutGrid, Loader2, Plus, X, Edit2, Palette } from "lucide-react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { extractPaletteFromImageSource } from "@/lib/app-builder/extract-palette-client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export function SiteCmsHub() {
  const { toast } = useToast();
  const [pages, setPages] = useState<CmsPageDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDesignStudio, setShowDesignStudio] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ label: "", description: "", publicPath: "" });
  const [designForm, setDesignForm] = useState({
    label: "",
    description: "",
    publicPath: "",
    templateId: "custom" as BuilderTemplateId,
  });

  const [tab, setTab] = useState<"pages" | "demos">("pages");
  const [demos, setDemos] = useState<any[]>([]);
  const [demosLoading, setDemosLoading] = useState(false);
  const [editingDemo, setEditingDemo] = useState<any | null>(null);
  const [demoForm, setDemoForm] = useState({
    slug: "",
    name: "",
    brandName: "",
    tagline: "",
    description: "",
    imageUrl: "",
    primaryColor: "",
    accentColor: "",
    outcomesText: "",
  });
  const [screensForm, setScreensForm] = useState<Record<string, { title: string; description: string; imageUrl: string }>>({});
  const [seedsForm, setSeedsForm] = useState<Record<string, Array<Record<string, any>>>>({});
  const [footerForm, setFooterForm] = useState<any[]>([]);
  const [savingDemo, setSavingDemo] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false);

  const loadDemos = useCallback(async () => {
    setDemosLoading(true);
    try {
      const res = await fetch("/api/admin/demo-apps");
      if (res.ok) {
        const data = await res.json();
        setDemos(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDemosLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/cms")
      .then((res) => res.json())
      .then((data: { pages: CmsPageDefinition[] }) => setPages(data.pages))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "demos") {
      void loadDemos();
    }
  }, [tab, loadDemos]);

  function startEditingDemo(demo: any) {
    setDemoForm({
      slug: demo.slug,
      name: demo.name,
      brandName: demo.brandName,
      tagline: demo.tagline,
      description: demo.description,
      imageUrl: demo.imageUrl || "",
      primaryColor: demo.primaryColor || "#0f2744",
      accentColor: demo.accentColor || "#0d9488",
      outcomesText: (demo.outcomes || []).join("\n"),
    });
    
    const initialScreens: Record<string, any> = {};
    (demo.screens || []).forEach((s: any) => {
      initialScreens[s.id] = {
        title: s.title || "",
        description: s.description || "",
        imageUrl: s.imageUrl || "",
      };
    });
    setScreensForm(initialScreens);

    const initialSeeds: Record<string, any[]> = {};
    (demo.entities || []).forEach((e: any) => {
      initialSeeds[e.id] = (e.seeds || []).map((row: any) => ({
        ...row,
        imageUrl: row.imageUrl || "",
      }));
    });
    setSeedsForm(initialSeeds);

    setFooterForm(demo.footerColumns || []);
    setEditingDemo(demo);
  }

  function updateScreenField(screenId: string, field: "title" | "description" | "imageUrl", value: string) {
    setScreensForm((prev) => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        [field]: value,
      },
    }));
  }

  function addFooterColumn() {
    setFooterForm((prev) => [...prev, { title: "New Column", links: [] }]);
  }

  function removeFooterColumn(index: number) {
    setFooterForm((prev) => prev.filter((_, i) => i !== index));
  }

  function updateColumnTitle(index: number, title: string) {
    setFooterForm((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], title };
      return next;
    });
  }

  function addFooterLink(colIndex: number) {
    setFooterForm((prev) => {
      const next = [...prev];
      next[colIndex] = {
        ...next[colIndex],
        links: [...next[colIndex].links, { label: "New Link", panel: "about" }],
      };
      return next;
    });
  }

  function removeFooterLink(colIndex: number, linkIndex: number) {
    setFooterForm((prev) => {
      const next = [...prev];
      next[colIndex] = {
        ...next[colIndex],
        links: next[colIndex].links.filter((_: any, i: number) => i !== linkIndex),
      };
      return next;
    });
  }

  function updateLinkValue(colIndex: number, linkIndex: number, key: string, val: string) {
    setFooterForm((prev) => {
      const next = [...prev];
      const nextLinks = [...next[colIndex].links];
      nextLinks[linkIndex] = { ...nextLinks[linkIndex], [key]: val };
      next[colIndex] = { ...next[colIndex], links: nextLinks };
      return next;
    });
  }

  async function handleExtractColors() {
    if (!demoForm.imageUrl) {
      toast("Please select a cover image or upload one first.", "error");
      return;
    }
    setExtractingColors(true);
    try {
      const palette = await extractPaletteFromImageSource(demoForm.imageUrl);
      if (palette.length > 0) {
        const primary = palette[0];
        const accent = palette[1] || palette[2] || palette[0];
        setDemoForm((f) => ({
          ...f,
          primaryColor: primary,
          accentColor: accent,
        }));
        toast("Theme colours extracted successfully from image!", "success");
      } else {
        toast("Could not sample colours from this image.", "error");
      }
    } catch (err) {
      toast("Failed to extract colours. Cross-origin restrictions might apply.", "error");
    } finally {
      setExtractingColors(false);
    }
  }

  async function handleSaveDemo(e: React.FormEvent) {
    e.preventDefault();
    setSavingDemo(true);
    try {
      const outcomes = demoForm.outcomesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/demo-apps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: demoForm.slug,
          name: demoForm.name,
          brandName: demoForm.brandName,
          tagline: demoForm.tagline,
          description: demoForm.description,
          imageUrl: demoForm.imageUrl,
          primaryColor: demoForm.primaryColor,
          accentColor: demoForm.accentColor,
          outcomes,
          screens: screensForm,
          footerColumns: footerForm,
          entities: Object.fromEntries(
            Object.entries(seedsForm).map(([id, seeds]) => [id, { seeds }])
          ),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Failed to save demo app", "error");
        return;
      }

      toast("Demo product updated successfully", "success");
      setEditingDemo(null);
      void loadDemos();
    } catch {
      toast("Error saving demo product", "error");
    } finally {
      setSavingDemo(false);
    }
  }

  const groups = useMemo(() => {
    const set = new Set(pages.map((page) => page.group));
    return [...set];
  }, [pages]);

  async function handleDesignCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...designForm,
          editorLayout: "builder",
        }),
      });
      const data = (await res.json()) as { page?: CmsPageDefinition; error?: string };
      if (!res.ok) {
        toast(data.error || "Failed to create page", "error");
        return;
      }
      toast("Design page created - drag components to build", "success");
      setShowDesignStudio(false);
      setDesignForm({ label: "", description: "", publicPath: "", templateId: "custom" });
      if (data.page) {
        window.location.href = `/admin/site-cms/${data.page.id}`;
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { page?: CmsPageDefinition; error?: string };
      if (!res.ok) {
        toast(data.error || "Failed to create page", "error");
        return;
      }
      toast("Page created", "success");
      setShowCreate(false);
      setForm({ label: "", description: "", publicPath: "" });
      if (data.page) {
        window.location.href = `/admin/site-cms/${data.page.id}`;
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <PageLoader message="Loading Site CMS…" />;
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-3xl">Site CMS</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary md:text-base">
            Revamp any page without touching code - edit text, swap images, upload photos, and build new pages
            with a visual editor. Pick a page below or create a new one.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowDesignStudio(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-teal"
          >
            <LayoutGrid className="h-4 w-4" />
            Design your own page
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:border-accent-teal/40"
          >
            <Plus className="h-4 w-4" />
            Simple page
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          type="button"
          onClick={() => setTab("pages")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "pages"
              ? "border-accent-teal text-accent-teal"
              : "border-transparent text-text-secondary hover:text-foreground"
          }`}
        >
          Website Pages
        </button>
        <button
          type="button"
          onClick={() => setTab("demos")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "demos"
              ? "border-accent-teal text-accent-teal"
              : "border-transparent text-text-secondary hover:text-foreground"
          }`}
        >
          Demo Products (50 Apps)
        </button>
      </div>

      {tab === "pages" && groups.map((group) => {
        const groupPages = pages.filter((page) => page.group === group);
        if (groupPages.length === 0) return null;

        return (
          <section key={group} className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-secondary">
              {group}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groupPages.map((page) => (
                <Link key={page.id} href={`/admin/site-cms/${page.id}`}>
                  <Card hover className="h-full p-5">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-accent-teal" />
                      <div>
                        <h3 className="font-semibold text-foreground">{page.label}</h3>
                        <p className="mt-1 text-sm text-text-secondary">{page.description}</p>
                        {page.editorLayout === "builder" ? (
                          <p className="mt-2 text-xs font-medium text-accent-teal">Design studio page</p>
                        ) : null}
                        {page.publicPath && (
                          <p className="mt-2 font-mono text-xs text-text-muted">{page.publicPath}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {tab === "demos" && (
        <div className="space-y-6">
          {demosLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-accent-teal" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {demos.map((demo) => (
                <Card
                  key={demo.slug}
                  hover
                  className="group flex h-full flex-col overflow-hidden p-0 border border-border bg-card text-left"
                >
                  {demo.imageUrl && (
                    <div className="relative h-40 w-full overflow-hidden shrink-0 border-b border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={demo.imageUrl}
                        alt={demo.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 left-2 rounded-full bg-navy/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                        {demo.groupLabel}
                      </span>
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent-teal truncate">
                          {demo.brandName}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-foreground leading-snug">
                          {demo.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEditingDemo(demo)}
                        className="rounded-lg border border-border p-1.5 hover:bg-muted text-text-secondary hover:text-foreground shrink-0"
                        title="Edit app copy and image"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs font-medium text-foreground/80">{demo.tagline}</p>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground flex-1">
                      {demo.description}
                    </p>
                    <p className="mt-3 text-[11px] text-text-muted">
                      Slug: <code className="text-[10px] text-accent-teal">{demo.slug}</code>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {editingDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg p-5 my-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold truncate">Edit Demo Product: {editingDemo.name}</h2>
              <button type="button" onClick={() => setEditingDemo(null)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => void handleSaveDemo(e)} className="space-y-4">
              <p className="text-xs text-text-secondary">
                Customize the metadata and cover image for this demo app. Changes apply immediately to the index catalogue and individual headers.
              </p>
              
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Brand Name</span>
                <input
                  required
                  value={demoForm.brandName}
                  onChange={(e) => setDemoForm((f) => ({ ...f, brandName: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Category Name</span>
                <input
                  required
                  value={demoForm.name}
                  onChange={(e) => setDemoForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Tagline</span>
                <input
                  required
                  value={demoForm.tagline}
                  onChange={(e) => setDemoForm((f) => ({ ...f, tagline: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Description</span>
                <textarea
                  required
                  rows={3}
                  value={demoForm.description}
                  onChange={(e) => setDemoForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Learning Outcomes (one outcome per line)</span>
                <textarea
                  rows={3}
                  value={demoForm.outcomesText}
                  onChange={(e) => setDemoForm((f) => ({ ...f, outcomesText: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm font-sans"
                  placeholder="e.g. Practicing risk compliance"
                />
              </label>

              <MediaPicker
                value={demoForm.imageUrl}
                onSelect={(path) => setDemoForm((f) => ({ ...f, imageUrl: path }))}
                label="Cover Image / App Logo"
                hint="Swap or upload a high-quality visual representation for this product"
              />

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-text-secondary flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block border border-border" style={{ backgroundColor: demoForm.primaryColor }} />
                    Primary Theme Colour
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={demoForm.primaryColor}
                      onChange={(e) => setDemoForm((f) => ({ ...f, primaryColor: e.target.value }))}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-border"
                    />
                    <input
                      required
                      value={demoForm.primaryColor}
                      onChange={(e) => setDemoForm((f) => ({ ...f, primaryColor: e.target.value }))}
                      className="w-full rounded-xl border border-border px-3 py-1 text-sm font-mono"
                      placeholder="#0f2744"
                    />
                  </div>
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-text-secondary flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block border border-border" style={{ backgroundColor: demoForm.accentColor }} />
                    Accent Theme Colour
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={demoForm.accentColor}
                      onChange={(e) => setDemoForm((f) => ({ ...f, accentColor: e.target.value }))}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-border"
                    />
                    <input
                      required
                      value={demoForm.accentColor}
                      onChange={(e) => setDemoForm((f) => ({ ...f, accentColor: e.target.value }))}
                      className="w-full rounded-xl border border-border px-3 py-1 text-sm font-mono"
                      placeholder="#0d9488"
                    />
                  </div>
                </label>
              </div>

              {demoForm.imageUrl && (
                <button
                  type="button"
                  disabled={extractingColors}
                  onClick={() => void handleExtractColors()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted mb-2"
                >
                  <Palette className="h-3.5 w-3.5" />
                  {extractingColors ? "Extracting..." : "Define theme colours from image"}
                </button>
              )}

              {editingDemo && editingDemo.screens && editingDemo.screens.length > 0 && (
                <div className="space-y-4 border-t border-border pt-4 max-h-[300px] overflow-y-auto pr-1">
                  <h3 className="text-sm font-semibold text-foreground">Configure App Screens & Pages</h3>
                  <div className="space-y-3">
                    {editingDemo.screens.map((s: any) => {
                      const sf = screensForm[s.id] || { title: "", description: "", imageUrl: "" };
                      return (
                        <div key={s.id} className="rounded-xl border border-border p-3 space-y-2 bg-muted/20">
                          <p className="text-xs font-semibold text-accent-teal uppercase tracking-wider">{s.id} Screen</p>
                          <label className="block text-sm">
                            <span className="mb-0.5 block text-[10px] font-medium text-text-secondary">Page Title</span>
                            <input
                              value={sf.title}
                              onChange={(e) => updateScreenField(s.id, "title", e.target.value)}
                              className="w-full rounded-lg border border-border px-3 py-1.5 text-xs bg-background"
                            />
                          </label>
                          <label className="block text-sm">
                            <span className="mb-0.5 block text-[10px] font-medium text-text-secondary">Description / Subtitle</span>
                            <textarea
                              rows={2}
                              value={sf.description}
                              onChange={(e) => updateScreenField(s.id, "description", e.target.value)}
                              className="w-full rounded-lg border border-border px-3 py-1.5 text-xs bg-background"
                            />
                          </label>
                          <MediaPicker
                            value={sf.imageUrl}
                            onSelect={(path) => updateScreenField(s.id, "imageUrl", path)}
                            label="Screen Cover Image"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Configure App Footer Links */}
              <div className="space-y-4 border-t border-border pt-4 max-h-[300px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Configure App Footer Links</h3>
                  <button
                    type="button"
                    onClick={addFooterColumn}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent-teal hover:underline"
                  >
                    + Add Column
                  </button>
                </div>
                
                <div className="space-y-4">
                  {footerForm.map((col, colIdx) => (
                    <div key={colIdx} className="rounded-xl border border-border p-3 space-y-3 bg-muted/20 relative">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm flex-1 mr-4">
                          <span className="mb-0.5 block text-[10px] font-medium text-text-secondary">Column Title</span>
                          <input
                            value={col.title}
                            onChange={(e) => updateColumnTitle(colIdx, e.target.value)}
                            className="w-full rounded-lg border border-border px-3 py-1.5 text-xs bg-background font-semibold"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeFooterColumn(colIdx)}
                          className="text-xs text-rose-500 font-semibold hover:underline mt-4"
                        >
                          Remove Col
                        </button>
                      </div>

                      <div className="space-y-2 pl-2 border-l-2 border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Links</span>
                          <button
                            type="button"
                            onClick={() => addFooterLink(colIdx)}
                            className="text-[10px] font-bold text-accent-teal hover:underline"
                          >
                            + Add Link
                          </button>
                        </div>

                        {col.links.map((link: any, linkIdx: number) => (
                          <div key={linkIdx} className="flex gap-2 items-center bg-background p-2 rounded-lg border border-border">
                            <input
                              value={link.label}
                              placeholder="Link Label"
                              onChange={(e) => updateLinkValue(colIdx, linkIdx, "label", e.target.value)}
                              className="w-1/3 rounded-md border border-border px-2 py-1 text-[11px] bg-background"
                            />
                            
                            <select
                              value={link.panel || "about"}
                              onChange={(e) => updateLinkValue(colIdx, linkIdx, "panel", e.target.value)}
                              className="w-1/3 rounded-md border border-border px-2 py-1 text-[11px] bg-background"
                            >
                              <option value="about">About (brochure)</option>
                              <option value="help">Help Centre</option>
                              <option value="support">Support Panel</option>
                              <option value="terms">Terms of Use</option>
                              <option value="privacy">Privacy Policy</option>
                              <option value="security">Security Statement</option>
                              <option value="legal">Legal Disclaimer</option>
                            </select>

                            <input
                              value={link.screenId || ""}
                              placeholder="Or Screen ID"
                              onChange={(e) => updateLinkValue(colIdx, linkIdx, "screenId", e.target.value)}
                              className="w-1/4 rounded-md border border-border px-2 py-1 text-[11px] bg-background"
                            />

                            <button
                              type="button"
                              onClick={() => removeFooterLink(colIdx, linkIdx)}
                              className="text-rose-500 font-bold text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configure App Sample Records */}
              {editingDemo && editingDemo.entities && editingDemo.entities.length > 0 && (
                <div className="space-y-4 border-t border-border pt-4 max-h-[300px] overflow-y-auto pr-1">
                  <h3 className="text-sm font-semibold text-foreground">Configure App Sample Records</h3>
                  <div className="space-y-4">
                    {editingDemo.entities.map((e: any) => {
                      const entitySeeds = seedsForm[e.id] || [];
                      if (entitySeeds.length === 0) return null;
                      return (
                        <div key={e.id} className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-accent-teal">{e.namePlural}</p>
                          <div className="space-y-2 pl-2 border-l-2 border-border">
                            {entitySeeds.map((row: any, idx: number) => (
                              <div key={idx} className="rounded-xl border border-border p-3 space-y-2 bg-muted/20">
                                <p className="text-xs font-semibold text-foreground">
                                  Record #{idx + 1}: {row.title || row.name || `Sample ${e.name}`}
                                </p>
                                <MediaPicker
                                  value={row.imageUrl}
                                  onSelect={(path) => {
                                    setSeedsForm((prev) => {
                                      const next = { ...prev };
                                      const nextRows = [...next[e.id]];
                                      nextRows[idx] = { ...nextRows[idx], imageUrl: path };
                                      next[e.id] = nextRows;
                                      return next;
                                    });
                                  }}
                                  label="Record Cover Image / Avatar"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={savingDemo}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-teal py-2.5 text-sm font-semibold text-white disabled:opacity-50 mt-4"
              >
                {savingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save demo product"}
              </button>
            </form>
          </Card>
        </div>
      )}

      {showDesignStudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Design your own page</h2>
              <button type="button" onClick={() => setShowDesignStudio(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => void handleDesignCreate(e)} className="space-y-4">
              <p className="text-sm text-text-secondary">
                AEM-style page builder - drag components from the library, edit properties, preview, then publish.
              </p>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Page title</span>
                <input
                  required
                  value={designForm.label}
                  onChange={(e) => setDesignForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2.5"
                  placeholder="AI workshop landing"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Public URL</span>
                <input
                  required
                  value={designForm.publicPath}
                  onChange={(e) => setDesignForm((f) => ({ ...f, publicPath: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2.5 font-mono text-sm"
                  placeholder="/ai-workshop"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Subtitle</span>
                <input
                  value={designForm.description}
                  onChange={(e) => setDesignForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2.5"
                />
              </label>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-text-secondary">Start from template</legend>
                {Object.entries(BUILDER_TEMPLATES).map(([id, template]) => {
                  const isCustom = id === "custom";
                  const selected = designForm.templateId === id;
                  return (
                    <label
                      key={id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        selected
                          ? "border-accent-teal bg-accent-teal/5"
                          : "border-border hover:border-accent-teal/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        checked={selected}
                        onChange={() => setDesignForm((f) => ({ ...f, templateId: id as BuilderTemplateId }))}
                        className="mt-1"
                      />
                      <span>
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {template.label}
                          {isCustom ? (
                            <span className="rounded-full bg-accent-teal/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-teal">
                              Blank canvas
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-text-secondary">{template.description}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-teal py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutGrid className="h-4 w-4" />}
                Open design studio
              </button>
            </form>
          </Card>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create new page</h2>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <p className="text-sm text-text-secondary">
                After creating, you&apos;ll get a full visual editor - add a hero banner, write your content,
                and insert images anywhere in the page.
              </p>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Page title</span>
                <input
                  required
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2.5"
                  placeholder="Corporate training"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Public URL</span>
                <input
                  required
                  value={form.publicPath}
                  onChange={(e) => setForm((f) => ({ ...f, publicPath: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2.5 font-mono text-sm"
                  placeholder="/corporate"
                />
                <span className="mt-1 block text-xs text-text-secondary">Start with / - e.g. /corporate or /about-us</span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Subtitle</span>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2.5"
                  placeholder="Shown under the title on the live page"
                />
              </label>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-teal py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create & edit page
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}