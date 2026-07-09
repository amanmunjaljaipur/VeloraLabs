import { Spinner } from "@/components/ui/Spinner";
import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  /** Short message shown next to the spinner */
  message?: string;
  /** Compact inline variant vs full page shell */
  variant?: "page" | "section" | "inline";
  className?: string;
}

/**
 * Future-proof route / section loader.
 * Use in loading.tsx, Suspense fallbacks, and client fetch states.
 */
export function PageLoader({
  message = "Loading…",
  variant = "page",
  className,
}: PageLoaderProps) {
  if (variant === "inline") {
    return (
      <div
        className={cn("inline-flex items-center gap-2 text-sm text-text-secondary", className)}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Spinner className="h-4 w-4" />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === "section") {
    return (
      <div
        className={cn("flex flex-col items-center justify-center gap-3 py-16 text-text-secondary", className)}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Spinner />
        <p className="text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-8 py-10 md:py-14", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex items-center gap-3 text-text-secondary">
        <Spinner />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2 max-w-md" label="" />
        <SkeletonText lines={2} className="max-w-2xl" />
      </div>
      <Skeleton className="h-48 w-full max-w-4xl" label="" />
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

/** Canvas-shaped skeleton for the design studio while blocks hydrate */
export function BuilderCanvasLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn("space-y-4 p-3", className)}
      role="status"
      aria-label="Loading design canvas"
    >
      <Skeleton className="h-56 w-full" label="" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" label="" />
        <Skeleton className="h-32" label="" />
        <Skeleton className="h-32" label="" />
      </div>
      <Skeleton className="h-40 w-full" label="" />
      <span className="sr-only">Loading design canvas…</span>
    </div>
  );
}
