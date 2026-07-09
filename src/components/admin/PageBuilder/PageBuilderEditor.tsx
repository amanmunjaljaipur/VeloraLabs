"use client";

import { BlockInspector } from "@/components/admin/PageBuilder/BlockInspector";
import { ComponentPalette, parseDroppedBlockType } from "@/components/admin/PageBuilder/ComponentPalette";
import { PageBuilderRenderer } from "@/components/page-builder/BlockRenderer";
import { useToast } from "@/components/ui/Toast";
import { createDefaultBlock } from "@/lib/cms/block-registry";
import type { BuilderPageContent, PageBlock, PageBlockType } from "@/lib/cms/page-builder-types";
import type { CmsPageDefinition } from "@/lib/cms/registry";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  GripVertical,
  Loader2,
  Rocket,
  Save,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

interface PageBuilderEditorProps {
  pageId: string;
  page: CmsPageDefinition;
  initialContent: BuilderPageContent;
  onMetaChange?: (meta: { label: string; description: string; publicPath: string }) => void;
}

function SortableCanvasItem({
  block,
  selected,
  onSelect,
  onRemove,
}: {
  block: PageBlock;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border-2 bg-background ${
        selected ? "border-accent-teal" : "border-transparent hover:border-border"
      }`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      role="button"
      tabIndex={0}
    >
      <div className="absolute left-3 top-3 z-10 rounded-md bg-card/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted opacity-0 shadow-sm transition group-hover:opacity-100">
        {block.type}
      </div>
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          className="rounded-lg border border-border bg-card p-1.5 text-text-secondary hover:text-foreground"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-lg border border-border bg-card p-1.5 text-red-600"
          aria-label="Remove block"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="pointer-events-none">
        <PageBuilderRenderer sections={[block]} />
      </div>
    </div>
  );
}

export function PageBuilderEditor({ pageId, page, initialContent, onMetaChange }: PageBuilderEditorProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [content, setContent] = useState<BuilderPageContent>(initialContent);
  const [selectedId, setSelectedId] = useState<string | null>(initialContent.sections[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pageMeta, setPageMeta] = useState({
    label: page.label,
    description: page.description,
    publicPath: page.publicPath ?? "",
  });

  const selectedBlock = useMemo(
    () => content.sections.find((block) => block.id === selectedId) ?? null,
    [content.sections, selectedId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addBlock = useCallback((type: PageBlockType) => {
    const block = createDefaultBlock(type);
    setContent((prev) => ({ ...prev, sections: [...prev.sections, block] }));
    setSelectedId(block.id);
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setContent((prev) => {
      const oldIndex = prev.sections.findIndex((block) => block.id === active.id);
      const newIndex = prev.sections.findIndex((block) => block.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return { ...prev, sections: arrayMove(prev.sections, oldIndex, newIndex) };
    });
  }

  function handleCanvasDrop(event: React.DragEvent) {
    event.preventDefault();
    const type = parseDroppedBlockType(event.dataTransfer);
    if (type) addBlock(type);
  }

  async function saveDraft() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cms/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, status: "draft" },
          meta: pageId.startsWith("custom-") ? pageMeta : undefined,
        }),
      });
      if (!res.ok) {
        toast("Failed to save draft", "error");
        return;
      }
      setContent((prev) => ({ ...prev, status: "draft" }));
      onMetaChange?.(pageMeta);
      toast("Draft saved", "success");
    } finally {
      setSaving(false);
    }
  }

  async function publishPage() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/cms/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            ...content,
            status: "published",
            publishedSections: structuredClone(content.sections),
          },
          meta: pageId.startsWith("custom-") ? pageMeta : undefined,
          publish: true,
        }),
      });
      if (!res.ok) {
        toast("Failed to publish", "error");
        return;
      }
      setContent((prev) => ({
        ...prev,
        status: "published",
        publishedSections: structuredClone(prev.sections),
      }));
      onMetaChange?.(pageMeta);
      toast("Page published live", "success");
    } finally {
      setPublishing(false);
    }
  }

  async function unpublishPage() {
    setUnpublishing(true);
    try {
      const res = await fetch(`/api/admin/cms/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            ...content,
            status: "draft",
            publishedSections: [],
          },
          meta: pageId.startsWith("custom-") ? pageMeta : undefined,
        }),
      });
      if (!res.ok) {
        toast("Failed to unpublish", "error");
        return;
      }
      setContent((prev) => ({
        ...prev,
        status: "draft",
        publishedSections: [],
      }));
      toast("Page unpublished — live site shows empty until you publish again", "success");
    } finally {
      setUnpublishing(false);
    }
  }

  async function deletePage() {
    if (!pageId.startsWith("custom-")) return;
    if (!window.confirm(`Delete “${pageMeta.label}”? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cms/${pageId}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Failed to delete page", "error");
        return;
      }
      toast("Page deleted", "success");
      router.push("/admin/site-cms");
    } finally {
      setDeleting(false);
    }
  }

  const isPublished = content.status === "published";

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-teal">
              Design your own page
            </p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                isPublished
                  ? "bg-teal/15 text-teal"
                  : "bg-amber-500/15 text-amber-800 dark:text-amber-200"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{pageMeta.label}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Drag components, edit properties, preview, then publish — AEM-style page building.
          </p>
          {pageMeta.publicPath ? (
            <p className="mt-2 font-mono text-xs text-text-muted">{pageMeta.publicPath}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:border-accent-teal/40"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <Link
            href="/admin/site-cms"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:border-accent-teal/40"
          >
            All pages
          </Link>
          {pageMeta.publicPath ? (
            <Link
              href={pageMeta.publicPath}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:border-accent-teal/40"
            >
              View live
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save draft
          </button>
          {isPublished ? (
            <button
              type="button"
              onClick={() => void unpublishPage()}
              disabled={unpublishing}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {unpublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              Unpublish
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void publishPage()}
            disabled={publishing}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Publish
          </button>
          {pageId.startsWith("custom-") ? (
            <button
              type="button"
              onClick={() => void deletePage()}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50 dark:border-red-800"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          ) : null}
        </div>
      </div>

      {pageId.startsWith("custom-") && (
        <div className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Page title</span>
            <input
              value={pageMeta.label}
              onChange={(e) => {
                const next = { ...pageMeta, label: e.target.value };
                setPageMeta(next);
                setContent((prev) => ({ ...prev, title: e.target.value }));
              }}
              className="w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Subtitle / SEO</span>
            <input
              value={pageMeta.description}
              onChange={(e) => {
                const next = { ...pageMeta, description: e.target.value };
                setPageMeta(next);
                setContent((prev) => ({
                  ...prev,
                  subtitle: e.target.value,
                  seoDescription: e.target.value,
                }));
              }}
              className="w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Public URL</span>
            <input
              value={pageMeta.publicPath}
              onChange={(e) => setPageMeta((prev) => ({ ...prev, publicPath: e.target.value }))}
              className="w-full rounded-xl border border-border px-3 py-2 font-mono text-sm"
            />
          </label>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="rounded-xl border border-border bg-card p-4 xl:sticky xl:top-4 xl:self-start">
          <ComponentPalette onAdd={addBlock} />
        </aside>

        <div
          className="min-h-[480px] rounded-xl border border-dashed border-border bg-muted/10 p-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          {content.sections.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/50 p-8 text-center">
              <p className="text-sm font-medium text-foreground">Canvas is empty</p>
              <p className="mt-2 max-w-sm text-sm text-text-secondary">
                Drag a component from the library or click + to start designing your page.
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={content.sections.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {content.sections.map((block) => (
                    <SortableCanvasItem
                      key={block.id}
                      block={block}
                      selected={selectedId === block.id}
                      onSelect={() => setSelectedId(block.id)}
                      onRemove={() => {
                        setContent((prev) => ({
                          ...prev,
                          sections: prev.sections.filter((item) => item.id !== block.id),
                        }));
                        if (selectedId === block.id) setSelectedId(null);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <aside className="xl:sticky xl:top-4 xl:self-start">
          <BlockInspector
            block={selectedBlock}
            onChange={(block) => {
              setContent((prev) => ({
                ...prev,
                sections: prev.sections.map((item) => (item.id === block.id ? block : item)),
              }));
            }}
          />
        </aside>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Preview — draft (not yet published)</p>
              <p className="text-xs text-text-secondary">This is how your page will look after publishing.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="rounded-lg border border-border p-2"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-white dark:bg-background">
            <PageBuilderRenderer sections={content.sections} />
          </div>
        </div>
      )}
    </div>
  );
}
