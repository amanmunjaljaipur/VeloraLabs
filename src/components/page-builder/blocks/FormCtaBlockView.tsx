import { ButtonLink } from "@/components/ui/ButtonLink";
import type { FormCtaBlockProps } from "@/lib/cms/page-builder-types";
import { Check } from "lucide-react";

export function FormCtaBlockView({ props }: { props: FormCtaBlockProps }) {
  return (
    <section className="border-y border-border bg-muted/20 py-14 md:py-20">
      <div className="container-verlin mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">{props.title}</h2>
        {props.description ? (
          <p className="mt-2 text-sm text-text-secondary">{props.description}</p>
        ) : null}
        {props.bullets?.length ? (
          <ul className="mt-6 space-y-2">
            {props.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {props.buttonLabel ? (
          <div className="mt-8">
            <ButtonLink href={props.buttonHref || "/free-session"} size="lg" fullWidth>
              {props.buttonLabel}
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}
