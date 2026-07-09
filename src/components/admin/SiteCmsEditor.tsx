"use client";

import { MediaPicker } from "@/components/admin/MediaPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { CmsPageDefinition } from "@/lib/cms/registry";
import {
  applyImageField,
  extractImageFields,
  getByPath,
  type CmsImageField,
} from "@/lib/cms/image-fields";
import { PageBuilderEditor } from "@/components/admin/PageBuilder/PageBuilderEditor";
import type { BuilderPageContent } from "@/lib/cms/page-builder-types";
import type { RichPageContent } from "@/lib/cms/rich-content";
import { applyTextFields, extractTextFields, type CmsTextField } from "@/lib/cms/text-fields";
import { PageLoader } from "@/components/ui/PageLoader";
import { ExternalLink, Save } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

interface SiteCmsEditorProps {
  pageId: string;
}

const DEFAULT_RICH: RichPageContent = {
  title: "",
  subtitle: "",
  bodyHtml: "",
  seoDescription: "",
  heroImage: "",
  heroImageAlt: "",
};

export function SiteCmsEditor({ pageId }: SiteCmsEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<CmsPageDefinition | null>(null);
  const [format, setFormat] = useState<"json" | "rich" | "builder">("json");
  const [richContent, setRichContent] = useState<RichPageContent>(DEFAULT_RICH);
  const [builderContent, setBuilderContent] = useState<BuilderPageContent | null>(null);
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [textFields, setTextFields] = useState<CmsTextField[]>([]);
  const [imageFields, setImageFields] = useState<CmsImageField[]>([]);
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
      format: "json" | "rich" | "builder";
    };
    setPage(data.page);
    setFormat(data.format);
    setPageMeta({
      label: data.page.label,
      description: data.page.description,
      publicPath: data.page.publicPath ?? "",
      group: data.page.group,
    });

    if (data.format === "builder") {
      setBuilderContent(data.content as BuilderPageContent);
    } else if (data.format === "rich") {
      setRichContent({ ...DEFAULT_RICH, ...(data.content as RichPageContent) });
    } else {
      setParsedJson(data.content);
      setTextFields(extractTextFields(data.content));
      setImageFields(extractImageFields(data.content));
    }
  }, [pageId, toast]);

  useEffect(() => {
    fetchPage().finally(() => setLoading(false));
  }, [fetchPage]);

  const groupedTextFields = useMemo(() => {
    const groups = new Map<string, CmsTextField[]>();
    for (const field of textFields) {
      const section = field.path.split(/[.[]/)[0] ?? "General";
      const list = groups.get(section) ?? [];
      list.push(field);
      groups.set(section, list);
    }
    return [...groups.entries()];
  }, [textFields]);

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

  function updateImageField(path: string, value: string) {
    setImageFields((fields) => fields.map((field) => (field.path === path ? { ...field, value } : field)));
    if (parsedJson) {
      setParsedJson(applyImageField(parsedJson, path, value));
    }
  }

  if (loading) {
    return <PageLoader message="Loading page content…" />;
  }

  if (!page) {
    return <p className="py-12 text-center text-text-secondary">Page not found.</p>;
  }

  if (format === "builder" && builderContent) {
    return (
      <PageBuilderEditor
        pageId={pageId}
        page={page}
        initialContent={builderContent}
        onMetaChange={(meta) => setPageMeta({ ...meta, group: pageMeta.group })}
      />
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <Card className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-teal">{page.group}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground">{page.label}</h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Edit text, images, and page content visually — no code or JSON needed. Click Save when you&apos;re done.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {page.publicPath && (
              <Link href={page.publicPath} target="_blank">
                <Button variant="secondary" size="sm">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Preview live
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

      {(isCustom || page.type === "rich" || page.type === "markdown") && (
        <Card className="space-y-4 p-5 md:p-6">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Page header</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Title and description shown at the top of the page and in search results.
            </p>
          </div>
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
              <span className="mb-1 block text-xs font-medium text-text-secondary">Subtitle</span>
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
                placeholder="Short summary for Google and social sharing"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        </Card>
      )}

      {format === "rich" && (
        <>
          <Card className="space-y-4 p-5 md:p-6">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Hero image</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Large banner image at the top of your page. Browse the library or upload a new image.
              </p>
            </div>
            <MediaPicker
              label="Banner image"
              hint="Recommended: wide image, at least 1200px wide"
              value={richContent.heroImage}
              onSelect={(heroImage) => setRichContent((c) => ({ ...c, heroImage }))}
            />
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-text-secondary">Image description (for accessibility)</span>
              <input
                value={richContent.heroImageAlt}
                onChange={(e) => setRichContent((c) => ({ ...c, heroImageAlt: e.target.value }))}
                placeholder="Describe what the image shows"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
              />
            </label>
          </Card>

          <Card className="p-5 md:p-6">
            <h2 className="mb-1 text-lg font-semibold tracking-[-0.02em] text-foreground">Page body</h2>
            <p className="mb-4 text-sm text-text-secondary">
              Write and format your full page content. Use the image button in the toolbar to add photos anywhere in the text.
            </p>
            <RichTextEditor
              value={richContent.bodyHtml}
              onChange={(bodyHtml) => setRichContent((content) => ({ ...content, bodyHtml }))}
              placeholder="Write your page content…"
            />
          </Card>
        </>
      )}

      {format === "json" && (
        <>
          {imageFields.length > 0 && parsedJson !== null && (
            <Card className="space-y-4 p-5 md:p-6">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Images</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Swap any illustration or photo on this page. Browse existing images or upload new ones.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {imageFields.map((field) => (
                  <MediaPicker
                    key={field.path}
                    label={field.label}
                    value={String(getByPath(parsedJson, field.path) ?? field.value)}
                    onSelect={(path) => updateImageField(field.path, path)}
                  />
                ))}
              </div>
            </Card>
          )}

          <Card className="space-y-6 p-5 md:p-6">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Text content</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Edit headlines, descriptions, and other copy. The page layout updates automatically when you save.
              </p>
            </div>
            {groupedTextFields.map(([section, fields]) => (
              <div key={section} className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                  {section.replace(/([A-Z])/g, " $1").trim()}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {fields.map((field) => (
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
              </div>
            ))}
          </Card>
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