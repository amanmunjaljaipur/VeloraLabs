import Image, { type ImageProps } from "next/image";

export type OptimizedImageProps = ImageProps & {
  /** Eager-load for above-the-fold / LCP candidates only */
  aboveFold?: boolean;
};

/**
 * Next/Image wrapper with aggressive lazy loading for below-fold media.
 * Only set aboveFold (or priority) on the single LCP image per page.
 */
export function OptimizedImage({
  aboveFold = false,
  priority,
  loading,
  fetchPriority,
  quality,
  ...props
}: OptimizedImageProps) {
  const eager = Boolean(priority ?? aboveFold);

  return (
    <Image
      {...props}
      priority={eager}
      loading={eager ? undefined : (loading ?? "lazy")}
      fetchPriority={fetchPriority ?? (eager ? "high" : "low")}
      quality={quality ?? (eager ? 75 : 58)}
    />
  );
}