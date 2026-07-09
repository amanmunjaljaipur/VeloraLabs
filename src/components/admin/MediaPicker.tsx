"use client";

import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";
import { Button } from "@/components/ui/Button";
import { ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface MediaPickerProps {
  value?: string;
  onSelect: (path: string) => void;
  label?: string;
  hint?: string;
}

export function MediaPicker({ value, onSelect, label = "Image", hint }: MediaPickerProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/cms/media", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) return;
    const data = (await res.json()) as { path: string };
    onSelect(data.path);
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-text-secondary">{hint}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowLibrary(true)}>
          <ImageIcon className="mr-1.5 h-4 w-4" />
          Browse library
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          loading={uploading}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          Upload new
        </Button>
        {value && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onSelect("")}
          >
            <X className="mr-1.5 h-4 w-4" />
            Remove
          </Button>
        )}
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

      {value ? (
        <div className="relative h-32 w-full max-w-xs overflow-hidden rounded-xl border border-border bg-muted/30">
          <div className="absolute inset-0 animate-pulse bg-muted/80" aria-hidden="true" />
          <Image
            src={value}
            alt={label ? `${label} preview` : "Selected image preview"}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <p className="text-xs text-text-secondary">No image selected yet.</p>
      )}

      <MediaLibraryModal
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={onSelect}
        title={label}
      />
    </div>
  );
}