import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { ImageBlockProps } from "@/lib/cms/page-builder-types";
import Link from "next/link";

export function ImageBlockView({ props }: { props: ImageBlockProps }) {
  if (!props.src) return null;

  const image = (
    <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-border bg-muted/30">
      <OptimizedImage
        src={props.src}
        alt={props.alt || props.caption || "Page image"}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 896px"
      />
    </div>
  );

  return (
    <section className="container-verlin py-8 md:py-12">
      <figure className="mx-auto max-w-4xl">
        {props.linkHref ? (
          <Link href={props.linkHref} className="block transition hover:opacity-95">
            {image}
          </Link>
        ) : (
          image
        )}
        {props.caption ? (
          <figcaption className="mt-3 text-center text-sm text-text-secondary">
            {props.caption}
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}
