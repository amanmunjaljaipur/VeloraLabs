"use client";

import { LegalSectionBlock, formatLegalDate } from "@/lib/legal/render";
import type { PublicLegalDocument } from "@/lib/legal/types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

interface LegalDocumentModalProps {
  open: boolean;
  onClose: () => void;
  document: PublicLegalDocument | null;
  loading?: boolean;
}

export function LegalDocumentModal({
  open,
  onClose,
  document: doc,
  loading,
}: LegalDocumentModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={doc?.title ?? "Legal document"}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            className={cn(
              "relative z-10 flex max-h-[min(85dvh,42rem)] w-full max-w-2xl flex-col",
              "overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
            )}
          >
            <header className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {loading ? "Loading…" : doc?.title}
                </h2>
                {doc && (
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Version {doc.version} · Last updated {formatLegalDate(doc.lastUpdated)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-text-secondary hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading && (
                <p className="text-sm text-text-secondary">Loading document…</p>
              )}
              {doc && (
                <div className="space-y-8">
                  <p className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-text-secondary">
                    {doc.disclaimer}
                  </p>
                  {doc.sections.map((section) => (
                    <LegalSectionBlock key={section.id} section={section} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}