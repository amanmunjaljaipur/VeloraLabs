import { ButtonLink } from "@/components/ui/ButtonLink";
import type { NewsletterBlockProps } from "@/lib/cms/page-builder-types";

export function NewsletterBlockView({ props }: { props: NewsletterBlockProps }) {
  return (
    <section className="border-y border-border bg-muted/20 py-14 md:py-20">
      <div className="container-verlin mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
        {props.description ? (
          <p className="mt-3 text-sm text-text-secondary md:text-base">{props.description}</p>
        ) : null}
        <div className="mt-8">
          <ButtonLink href="/newsletter" size="lg">
            {props.buttonLabel || "Subscribe free"}
          </ButtonLink>
        </div>
        {props.privacyNote ? (
          <p className="mt-4 text-xs text-text-muted">{props.privacyNote}</p>
        ) : null}
      </div>
    </section>
  );
}
