"use client";

import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { Loader2, Newspaper } from "lucide-react";
import { useState } from "react";

export function PublishNewsletterButton({
  onComplete,
  className,
}: {
  onComplete?: () => void;
  className?: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter/publish", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        edition?: { title: string; itemCount: number; publicUrl: string };
      };

      if (!res.ok) {
        toast(data.error || "Failed to publish newsletter", "error");
        return;
      }

      toast(
        `Published "${data.edition?.title}" with ${data.edition?.itemCount ?? 0} stories`,
        "success"
      );
      onComplete?.();
    } catch {
      toast("Failed to publish newsletter", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={loading}
      onClick={handlePublish}
      className={cn(
        "flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors",
        "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal" />
      ) : (
        <Newspaper className="h-4 w-4 shrink-0 text-teal" />
      )}
      {loading ? "Publishing…" : "Publish newsletter now"}
    </button>
  );
}