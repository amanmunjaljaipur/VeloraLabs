"use client";

import { MediaPicker } from "@/components/admin/MediaPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { CmsPageDefinition } from "@/lib/cms/registry";
import { applyTextFields, extractTextFields, type CmsTextField } from "@/lib/cms/text-fields";
import type { RichPageContent } from "@/lib/cms/rich-content";
import { ExternalLink, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

interface SiteCmsEditorProps {
  pageId: string;
}

function collectImageFields(node: unknown, prefix = ""): string[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) {
    return node.flatMap((item, index) => collectImageFields(item, `${prefix}[${index}]`));
  }
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string" && /image|illustration|src|avatar|thumb/i.test(key)) {
      return [path];
    }
    if (typeof value === "object") return collectImageFields(value, path);
    return [];
  });
}

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let current: unknown = obj;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setByPath(obj: unknown, path: string, value: string): unknown {
  const clone = structuredClone(obj) as Record<string, unknown>;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let current: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (!current[part] || typeof current[part] !== "object") current[part] = {};
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]!] = value;
  return clone;
}

export function SiteCmsEditor({ pageId }: SiteCmsEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<CmsPageDefinition | null>(null);
  const [format, setFormat] = useState<"json" | "rich">("json");
  const [richContent, setRichContent] = useState<RichPageContent>({
    title: "",
    subtitle: "",
    bodyHtml: "",
    seoDescription: "",
  });
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [textFields, setTextFields] = useState<CmsTextField[]>([]);
  const [pageMeta, setPageMeta] = useState({ label: "", description: "", publicPath: "", group: "" });
  const isCustom = pageId.startsWith("custom-");

  const fetchPage = useCallback(async () => {
    const res = await fetch(`/api/admin/cms/${pageId}`);
    if (!res.ok) {
      toast("Failed to load page content", "error");
      return;
    }
    const data = (await res.json()) as {
      page: CmsPageDefinition;
      content: unknown;
      format: "json" | "rich";
    };
    setPage(data.page);
    setFormat(data.format);
    setPageMeta({
      label: data.page.label,
      description: data.page.description,
      publicPath: data.page.publicPath ?? "",
      group: data.page.group,
    });

    if (data.format === "rich") {
      setRichContent(data.content as RichPageContent);
    } else {
      setParsedJson(data.content);
      setTextFields(extractTextFields(data.content));
    }
  }, [pageId, toast]);

  useEffect(() => {
    fetchPage().finally(() => setLoading(false));
  }, [fetchPage]);

  const imageFields = useMemo(
    () => (parsedJson ? collectImageFields(parsedJson) : []),
    [parsedJson]
  );

  async function handleSave() {
    if (!page) return;
    setSaving(true);

    const payload =
      format === "rich"
        ? { content: richContent, meta: isCustom ? pageMeta : undefined }
        : { content: parsedJson, meta: isCustom ? pageMeta : undefined };

    const res = await fetch(`/api/admin/cms/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast(data.error || "Save failed", "error");
      return;
    }

    toast(`${page.label} saved`, "success");
    await fetchPage();
  }

  function updateTextField(path: string, value: string) {
    setTextFields((fields) => fields.map((field) => (field.path === path ? { ...field, value } : field)));
    if (parsedJson) {
      setParsedJson(applyTextFields(parsedJson, [{ path, value }]));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading content…
      </div>
    );
  }

  if (!page) {
    return <p className="py-12 text-center text-text-secondary">Page not found.</p>;
  }

  return (
    <div className="space-y-6 pb-16">
      <Card className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-teal">{page.group}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground">{page.label}</h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">{page.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {page.publicPath && (
              <Link href={page.publicPath} target="_blank">
                <Button variant="secondary" size="sm">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  View live
                </Button>
              </Link>
            )}
            <Link href="/admin/site-cms">
              <Button variant="secondary" size="sm">All pages</Button>
            </Link>
            <Button size="sm" onClick={() => void handleSave()} loading={saving}>
              <Save className="mr-1.5 h-4 w-4" />
              Save changes
            </Button>
          </div>
        </div>
      </Card>

      {(isCustom || page.type === "rich") && (
        <Card className="space-y-4 p-5 md:p-6">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Page settings</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-text-secondary">Page title</span>
              <input
                value={isCustom ? pageMeta.label : richContent.title}
                onChange={(e) =>
                  isCustom
                    ? setPageMeta((m) => ({ ...m, label: e.target.value }))
                    : setRichContent((c) => ({ ...c, title: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-text-secondary">Public URL</span>
              <input
                value={pageMeta.publicPath}
                onChange={(e) => setPageMeta((m) => ({ ...m, publicPath: e.target.value }))}
                disabled={!isCustom}
                placeholder="/your-page-url"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 disabled:opacity-60"
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-text-secondary">Subtitle / description</span>
              <input
                value={isCustom ? pageMeta.description : richContent.subtitle}
                onChange={(e) =>
                  isCustom
                    ? setPageMeta((m) => ({ ...m, description: e.target.value }))
                    : setRichContent((c) => ({ ...c, subtitle: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-text-secondary">SEO description</span>
              <textarea
                value={richContent.seoDescription}
                onChange={(e) => setRichContent((c) => ({ ...c, seoDescription: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        </Card>
      )}

      {format === "rich" && (
        <Card className="p-5 md:p-6">
          <h2 className="mb-1 text-lg font-semibold tracking-[-0.02em] text-foreground">Page content</h2>
          <p className="mb-4 text-sm text-text-secondary">Use the toolbar to style text — no JSON or markdown required.</p>
          <RichTextEditor
            value={richContent.bodyHtml}
            onChange={(bodyHtml) => setRichContent((content) => ({ ...content, bodyHtml }))}
            placeholder="Write your page content…"
          />
        </Card>
      )}

      {format === "json" && (
        <>
          <Card className="space-y-4 p-5 md:p-6">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Text content</h2>
            <p className="text-sm text-text-secondary">
              Edit copy in plain text fields — the layout and structure stay intact automatically.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {textFields.map((field) => (
                <label key={field.path} className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-text-secondary">{field.label}</span>
                  {field.multiline ? (
                    <textarea
                      value={field.value}
                      onChange={(e) => updateTextField(field.path, e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  ) : (
                    <input
                      value={field.value}
                      onChange={(e) => updateTextField(field.path, e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  )}
                </label>
              ))}
            </div>
          </Card>

          {imageFields.length > 0 && parsedJson !== null && (
            <Card className="space-y-4 p-5 md:p-6">
              <h2 className="text-lg font-semibold text-foreground">Images</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {imageFields.map((fieldPath) => (
                  <MediaPicker
                    key={fieldPath}
                    label={fieldPath}
                    value={String(getByPath(parsedJson, fieldPath) ?? "")}
                    onSelect={(path) => setParsedJson(setByPath(parsedJson, fieldPath, path))}
                  />
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={() => void handleSave()} loading={saving}>
          <Save className="mr-1.5 h-4 w-4" />
          Save changes
        </Button>
      </div>
    </div>
  );
}