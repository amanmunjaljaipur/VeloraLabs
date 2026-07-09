import { ButtonLink } from "@/components/ui/ButtonLink";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { TeaserBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

export function TeaserBlockView({ props }: { props: TeaserBlockProps }) {
  const horizontal = props.layout === "horizontal";

  return (
    <section className="container-verlin py-10 md:py-14">
      <article
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-card",
          horizontal && "grid md:grid-cols-2"
        )}
      >
        {props.image ? (
          <div className={cn("relative bg-muted/30", horizontal ? "min-h-[240px]" : "aspect-[21/9]")}>
            <OptimizedImage
              src={props.image}
              alt={props.imageAlt || props.title}
              fill
              className="object-cover"
              sizes={horizontal ? "(max-width: 768px) 100vw, 50vw" : "100vw"}
            />
          </div>
        ) : null}
        <div className="flex flex-col justify-center p-6 md:p-8">
          {props.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">{props.eyebrow}</p>
          ) : null}
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{props.title}</h2>
          {props.description ? (
            <p className="mt-3 text-sm text-text-secondary md:text-base">{props.description}</p>
          ) : null}
          {props.linkLabel ? (
            <div className="mt-6">
              <ButtonLink href={props.linkHref || "/"} size="md">
                {props.linkLabel}
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
