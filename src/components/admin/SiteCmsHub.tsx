"use client";

import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { CmsPageDefinition } from "@/lib/cms/registry";
import { FileText, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function SiteCmsHub() {
  const { toast } = useToast();
  const [pages, setPages] = useState<CmsPageDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ label: "", description: "", publicPath: "" });

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
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading CMS pages…
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-3xl">Site CMS</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary md:text-base">
            Edit website copy with text fields and a visual editor — no JSON required. Create new pages,
            set their public URL, and connect them anywhere on the site.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-teal"
        >
          <Plus className="h-4 w-4" />
          New page
        </button>
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
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Short description</span>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-border px-3 py-2.5"
                  placeholder="Shown in search and page header"
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