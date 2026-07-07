"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface MediaItem {
  path: string;
  label: string;
  source: "upload" | "library";
}

interface MediaPickerProps {
  value?: string;
  onSelect: (path: string) => void;
  label?: string;
}

export function MediaPicker({ value, onSelect, label = "Image" }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
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
    if (open) loadImages();
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
    await loadImages();
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          placeholder="/images/example.jpg"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
          <ImageIcon className="mr-1.5 h-4 w-4" />
          Browse
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          loading={uploading}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          Upload
        </Button>
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

      {value && (
        <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-border bg-muted/30">
          <Image src={value} alt="" fill className="object-cover" unoptimized />
        </div>
      )}

      {open && (
        <div className="rounded-2xl border border-border bg-card p-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading media…
            </div>
          ) : (
            <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
              {images.map((image) => (
                <button
                  key={image.path}
                  type="button"
                  onClick={() => {
                    onSelect(image.path);
                    setOpen(false);
                  }}
                  className={cn(
                    "overflow-hidden rounded-xl border text-left transition-colors hover:border-accent-teal/40",
                    value === image.path ? "border-accent-teal ring-2 ring-accent-teal/20" : "border-border"
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
      )}
    </div>
  );
}