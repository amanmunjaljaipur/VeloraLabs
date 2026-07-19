"use client";

/**
 * Full-viewport product screen - hides admin chrome so you see the app alone.
 */

import { StudioVerlinPreview } from "@/components/app-studio/StudioVerlinPreview";
import { Button } from "@/components/ui/Button";
import type { GenericAppContent } from "@/lib/app-builder/types";
import { ExternalLink, Maximize2, X } from "lucide-react";
import { useEffect } from "react";

export function StudioAppFullscreen({
  open,
  onClose,
  content,
  publishedPath,
  publishedUrl,
}: {
  open: boolean;
  onClose: () => void;
  content: GenericAppContent | null;
  publishedPath?: string | null;
  publishedUrl?: string | null;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !content) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={`${content.brandName} full app view`}
    >
      {/* Viewer chrome - not part of the product */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-navy px-3 py-2 text-white md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Maximize2 className="h-4 w-4 shrink-0 opacity-80" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{content.brandName}</p>
            <p className="truncate text-[11px] text-white/70">
              Full app screen · Esc to close
              {publishedPath ? ` · ${publishedPath}` : " · Draft (not published yet)"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {publishedPath && (
            <a
              href={publishedUrl || publishedPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-medium hover:bg-white/20"
            >
              Open live link
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </div>

      {/* Complete product UI */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <StudioVerlinPreview content={content} fullScreen />
      </div>
    </div>
  );
}
