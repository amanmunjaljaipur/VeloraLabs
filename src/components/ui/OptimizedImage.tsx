"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type OptimizedImageProps = ImageProps & {
  /** Eager-load for above-the-fold / LCP candidates only */
  aboveFold?: boolean;
  /** Show pulse skeleton while the image loads (default true) */
  showLoader?: boolean;
  /** Wrapper class when showLoader is enabled */
  wrapperClassName?: string;
};

/**
 * Next/Image wrapper with lazy loading, skeleton loader, and accessible alt text.
 * Always pass a meaningful `alt` — empty string only for pure decoration.
 */
export function OptimizedImage({
  aboveFold = false,
  priority,
  loading,
  fetchPriority,
  quality,
  showLoader = true,
  wrapperClassName,
  className,
  alt,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const eager = Boolean(priority ?? aboveFold);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const safeAlt = typeof alt === "string" ? alt : "";

  const image = (
    <Image
      {...props}
      alt={safeAlt}
      priority={eager}
      loading={eager ? undefined : (loading ?? "lazy")}
      fetchPriority={fetchPriority ?? (eager ? "high" : "low")}
      quality={quality ?? (eager ? 75 : 58)}
      className={cn(
        className,
        showLoader && "transition-opacity duration-300",
        showLoader && !loaded && !failed && "opacity-0",
        showLoader && (loaded || failed) && "opacity-100"
      )}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        setFailed(true);
        setLoaded(true);
        onError?.(event);
      }}
    />
  );

  if (!showLoader) {
    return image;
  }

  const isFill = Boolean(props.fill);

  return (
    <span
      className={cn(
        "overflow-hidden",
        isFill
          ? "absolute inset-0 block h-full w-full"
          : "relative inline-block max-w-full",
        wrapperClassName
      )}
    >
      {!loaded && !failed ? (
        <span
          className="absolute inset-0 z-[1] animate-pulse bg-muted/80"
          aria-hidden="true"
        />
      ) : null}
      {image}
      {!loaded ? (
        <span className="sr-only">Loading image{safeAlt ? `: ${safeAlt}` : ""}…</span>
      ) : null}
    </span>
  );
}
