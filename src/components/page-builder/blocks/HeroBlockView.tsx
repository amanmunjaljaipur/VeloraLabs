import { ButtonLink } from "@/components/ui/ButtonLink";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { HeroBlockProps } from "@/lib/cms/page-builder-types";

export function HeroBlockView({ props }: { props: HeroBlockProps }) {
  return (
    <section className="overflow-hidden border-b border-border bg-[#0a1628] text-white">
      <div className="grid lg:grid-cols-2">
        <div className="flex items-center px-4 py-14 sm:px-6 md:py-16 lg:px-10 lg:py-20">
          <div className="mx-auto w-full max-w-xl lg:mx-0">
            {props.eyebrow ? (
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
                {props.eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {props.headline}
            </h1>
            {props.subheadline ? (
              <p className="mt-4 text-base leading-relaxed text-slate-300 md:text-lg">
                {props.subheadline}
              </p>
            ) : null}
            {(props.ctaLabel || props.secondaryCtaLabel) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {props.ctaLabel ? (
                  <ButtonLink href={props.ctaHref || "/free-session"} size="lg">
                    {props.ctaLabel}
                  </ButtonLink>
                ) : null}
                {props.secondaryCtaLabel ? (
                  <ButtonLink
                    href={props.secondaryCtaHref || "/programs"}
                    size="lg"
                    variant="secondary"
                  >
                    {props.secondaryCtaLabel}
                  </ButtonLink>
                ) : null}
              </div>
            )}
          </div>
        </div>
        {props.image ? (
          <div className="relative min-h-[280px] lg:min-h-[420px]">
            <OptimizedImage
              src={props.image}
              alt={props.imageAlt || props.headline || "Hero image"}
              fill
              aboveFold
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
