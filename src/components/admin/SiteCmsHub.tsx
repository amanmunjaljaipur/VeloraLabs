"use client";

import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { BUILDER_TEMPLATES, type BuilderTemplateId } from "@/lib/cms/block-registry";
import type { CmsPageDefinition } from "@/lib/cms/registry";
import { PageLoader } from "@/components/ui/PageLoader";
import { FileText, LayoutGrid, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    fetch("/api/admin/cms")
      .then((res) => res.json())
      .then((data: { pages: CmsPageDefinition[] }) => setPages(data.pages))
      .finally(() => setLoading(false));
  }, []);

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
      toast("Design page created — drag components to build", "success");
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
            Revamp any page without touching code — edit text, swap images, upload photos, and build new pages
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

      {groups.map((group) => {
        const groupPages = pages.filter((page) => page.group === group);
        if (groupPages.length === 0) return null;

        return (
          <section key={group}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-text-secondary">
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
                AEM-style page builder — drag components from the library, edit properties, preview, then publish.
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
                After creating, you&apos;ll get a full visual editor — add a hero banner, write your content,
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
                <span className="mt-1 block text-xs text-text-secondary">Start with / — e.g. /corporate or /about-us</span>
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