import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  /** Accessible label announced by screen readers while content loads */
  label?: string;
}

/** Pulse placeholder for text, cards, images, and page shells */
export function Skeleton({ className, label = "Loading" }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted/80", className)}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading text">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          label=""
          className={cn("h-3 rounded-md", i === lines - 1 ? "w-2/3 max-w-[66%]" : "w-full")}
        />
      ))}
      <span className="sr-only">Loading text…</span>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card p-5", className)}
      role="status"
      aria-label="Loading card"
    >
      <Skeleton className="mb-4 h-40 w-full" label="" />
      <Skeleton className="mb-2 h-4 w-3/4 max-w-[75%]" label="" />
      <SkeletonText lines={2} />
      <span className="sr-only">Loading card…</span>
    </div>
  );
}

export function SkeletonImage({
  className,
  aspect = "video",
  label = "Loading image",
}: {
  className?: string;
  aspect?: "video" | "square" | "wide" | "auto";
  label?: string;
}) {
  const aspectClass =
    aspect === "square"
      ? "aspect-square"
      : aspect === "wide"
        ? "aspect-[21/9]"
        : aspect === "auto"
          ? ""
          : "aspect-video";

  return (
    <Skeleton
      className={cn("w-full", aspectClass, className)}
      label={label}
    />
  );
}
