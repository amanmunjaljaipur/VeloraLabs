import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { GalleryBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

const COLS: Record<GalleryBlockProps["columns"], string> = {
  "2": "md:grid-cols-2",
  "3": "md:grid-cols-3",
  "4": "md:grid-cols-2 xl:grid-cols-4",
};

export function GalleryBlockView({ props }: { props: GalleryBlockProps }) {
  if (!props.items?.length) return null;

  return (
    <section className="container-verlin py-10 md:py-14">
      {props.title ? (
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight md:text-3xl">
          {props.title}
        </h2>
      ) : null}
      <div className={cn("grid gap-4", COLS[props.columns] ?? COLS["3"])}>
        {props.items.map((item, index) =>
          item.src ? (
            <figure key={index} className="overflow-hidden rounded-xl border border-border bg-muted/20">
              <div className="relative aspect-[4/3]">
                <OptimizedImage
                  src={item.src}
                  alt={item.alt || item.caption || `Gallery image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              {item.caption ? (
                <figcaption className="px-3 py-2 text-center text-xs text-text-secondary">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null
        )}
      </div>
    </section>
  );
}
