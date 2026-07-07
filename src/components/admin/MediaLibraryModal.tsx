"use client";

import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface MediaItem {
  path: string;
  label: string;
  source: "upload" | "library";
}

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  title?: string;
}

export function MediaLibraryModal({
  open,
  onClose,
  onSelect,
  title = "Choose an image",
}: MediaLibraryModalProps) {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/cms/media");
    setLoading(false);
    if (!res.ok) return;
    const data = (await res.json()) as { images: MediaItem[] };
    setImages(data.images);
  }, []);

  useEffect(() => {
    if (open) void loadImages();
  }, [open, loadImages]);

  async function handleUpload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/cms/media", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) return;
    const data = (await res.json()) as { path: string };
    onSelect(data.path);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-accent-teal" />
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-text-secondary hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border px-5 py-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload new image
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-secondary">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading images…
            </div>
          ) : images.length === 0 ? (
            <p className="py-16 text-center text-sm text-text-secondary">
              No images yet. Upload one to get started.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((image) => (
                <button
                  key={image.path}
                  type="button"
                  onClick={() => {
                    onSelect(image.path);
                    onClose();
                  }}
                  className={cn(
                    "overflow-hidden rounded-xl border text-left transition-colors hover:border-accent-teal/50 hover:ring-2 hover:ring-accent-teal/15",
                    "border-border"
                  )}
                >
                  <div className="relative aspect-video bg-muted/40">
                    <Image src={image.path} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <p className="truncate px-2 py-1.5 text-[11px] text-text-secondary">{image.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}