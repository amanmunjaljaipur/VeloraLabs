import type { QuoteBlockProps } from "@/lib/cms/page-builder-types";

export function QuoteBlockView({ props }: { props: QuoteBlockProps }) {
  return (
    <section className="container-verlin py-10 md:py-14">
      <blockquote className="mx-auto max-w-3xl rounded-2xl border border-border bg-muted/20 px-6 py-8 md:px-10 md:py-10">
        <p className="text-xl font-medium leading-relaxed text-foreground md:text-2xl">
          “{props.quote}”
        </p>
        {(props.attribution || props.role) && (
          <footer className="mt-6 border-t border-border pt-4 text-sm">
            {props.attribution ? (
              <cite className="not-italic font-semibold text-foreground">{props.attribution}</cite>
            ) : null}
            {props.role ? <p className="text-text-secondary">{props.role}</p> : null}
          </footer>
        )}
      </blockquote>
    </section>
  );
}
