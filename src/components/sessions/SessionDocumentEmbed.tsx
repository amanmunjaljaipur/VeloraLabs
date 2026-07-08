"use client";

import { buildGoogleDriveEmbedUrl } from "@/lib/google-drive";
import type { SessionDocumentType } from "@/lib/session-documents";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface SessionDocumentEmbedProps {
  url: string;
  title: string;
  type: SessionDocumentType;
  protected?: boolean;
}

export function SessionDocumentEmbed({
  url,
  title,
  type,
  protected: isProtected = false,
}: SessionDocumentEmbedProps) {
  const [obscured, setObscured] = useState(false);
  const embedUrl = buildGoogleDriveEmbedUrl(url);
  const isSlides = type === "slides";

  useEffect(() => {
    if (!isProtected) return;

    const obscure = () => setObscured(true);
    const reveal = () => setObscured(false);

    const handleVisibility = () => {
      if (document.hidden) obscure();
      else reveal();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "PrintScreen") obscure();
      if (event.metaKey && event.shiftKey && ["3", "4", "5", "s"].includes(event.key.toLowerCase())) {
        obscure();
      }
    };

    window.addEventListener("blur", obscure);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("blur", obscure);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProtected]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-border bg-muted/30",
        isSlides ? "aspect-video min-h-[280px] md:min-h-[360px]" : "min-h-[420px] md:min-h-[520px]",
        isProtected && "select-none"
      )}
      style={
        isProtected
          ? ({ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" } as const)
          : undefined
      }
      onContextMenu={isProtected ? (event) => event.preventDefault() : undefined}
      onCopy={isProtected ? (event) => event.preventDefault() : undefined}
      onCut={isProtected ? (event) => event.preventDefault() : undefined}
      onDragStart={isProtected ? (event) => event.preventDefault() : undefined}
    >
      <iframe
        src={embedUrl}
        title={title}
        className={cn(
          "absolute inset-0 h-full w-full border-0 transition-[filter] duration-200",
          obscured && isProtected && "blur-xl scale-[1.02]"
        )}
        allow="autoplay; fullscreen"
        referrerPolicy="no-referrer"
      />
      {isProtected && (
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-background/5"
          aria-hidden
        />
      )}
      {obscured && isProtected && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <p className="rounded-full bg-card/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
            Return to this tab to continue viewing
          </p>
        </div>
      )}
    </div>
  );
}