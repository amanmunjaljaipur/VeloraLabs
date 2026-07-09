import { ButtonLink } from "@/components/ui/ButtonLink";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { SplitBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

export function SplitBlockView({ props }: { props: SplitBlockProps }) {
  const imageFirst = props.imagePosition === "left";

  return (
    <section className="container-verlin py-12 md:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className={cn(imageFirst && "lg:order-2")}>
          {props.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">{props.eyebrow}</p>
          ) : null}
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
          <div
            className="cms-rich-prose mt-4"
            dangerouslySetInnerHTML={{ __html: props.bodyHtml }}
          />
          {props.ctaLabel ? (
            <div className="mt-6">
              <ButtonLink href={props.ctaHref || "/"} size="md">
                {props.ctaLabel}
              </ButtonLink>
            </div>
          ) : null}
        </div>
        {props.image ? (
          <div className={cn("relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted/30", imageFirst && "lg:order-1")}>
            <OptimizedImage
              src={props.image}
              alt={props.imageAlt || props.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
