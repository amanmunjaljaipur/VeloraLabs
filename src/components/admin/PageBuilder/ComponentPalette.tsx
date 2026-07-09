"use client";

import { BLOCK_DEFINITIONS, createDefaultBlock, isKnownBlockType, type BlockCategory } from "@/lib/cms/block-registry";
import type { PageBlockType } from "@/lib/cms/page-builder-types";
import { GripVertical, Plus } from "lucide-react";

interface ComponentPaletteProps {
  onAdd: (type: PageBlockType) => void;
}

const CATEGORIES: BlockCategory[] = [
  "Layout",
  "Content",
  "Media",
  "Conversion",
  "Social proof",
];

export function ComponentPalette({ onAdd }: ComponentPaletteProps) {
  return (
    <div className="max-h-[calc(100vh-8rem)] space-y-5 overflow-y-auto pr-1">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Component library</h3>
        <p className="mt-1 text-xs text-text-secondary">
          {BLOCK_DEFINITIONS.length} AEM-style blocks — drag onto the canvas or click + to add.
        </p>
      </div>

      {CATEGORIES.map((category) => {
        const blocks = BLOCK_DEFINITIONS.filter((block) => block.category === category);
        if (blocks.length === 0) return null;
        return (
          <div key={category}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {category} ({blocks.length})
            </p>
            <div className="space-y-2">
              {blocks.map((block) => {
                const Icon = block.icon;
                return (
                  <button
                    key={block.type}
                    type="button"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("application/x-page-block-type", block.type);
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => onAdd(block.type)}
                    title={`AEM: ${block.aemEquivalent}`}
                    className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition hover:border-accent-teal/40 hover:bg-muted/30"
                  >
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{block.label}</span>
                        <Plus className="h-3.5 w-3.5 text-text-muted" />
                      </span>
                      <span className="mt-0.5 block text-xs text-text-secondary">{block.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function parseDroppedBlockType(dataTransfer: DataTransfer): PageBlockType | null {
  const type = dataTransfer.getData("application/x-page-block-type");
  if (!type || !isKnownBlockType(type)) return null;
  return type;
}

export function createBlockFromDrop(type: PageBlockType) {
  return createDefaultBlock(type);
}
