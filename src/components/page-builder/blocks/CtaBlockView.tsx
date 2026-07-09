import { ButtonLink } from "@/components/ui/ButtonLink";
import type { CtaBlockProps } from "@/lib/cms/page-builder-types";

export function CtaBlockView({ props }: { props: CtaBlockProps }) {
  const isDark = props.variant === "dark";

  return (
    <section
      className={
        isDark
          ? "bg-[#0a1628] py-14 text-white md:py-20"
          : "border-y border-border bg-muted/20 py-14 md:py-20"
      }
    >
      <div className="container-verlin text-center">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
        {props.description ? (
          <p
            className={`mx-auto mt-3 max-w-2xl text-sm md:text-base ${
              isDark ? "text-slate-300" : "text-text-secondary"
            }`}
          >
            {props.description}
          </p>
        ) : null}
        {(props.buttonLabel || props.secondaryLabel) && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {props.buttonLabel ? (
              <ButtonLink href={props.buttonHref || "/contact"} size="lg">
                {props.buttonLabel}
              </ButtonLink>
            ) : null}
            {props.secondaryLabel ? (
              <ButtonLink
                href={props.secondaryHref || "/contact"}
                size="lg"
                variant="secondary"
              >
                {props.secondaryLabel}
              </ButtonLink>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
