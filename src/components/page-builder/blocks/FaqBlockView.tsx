import { Accordion } from "@/components/ui/Accordion";
import type { FaqBlockProps } from "@/lib/cms/page-builder-types";

export function FaqBlockView({ props }: { props: FaqBlockProps }) {
  return (
    <section className="border-t border-border bg-muted/10 py-14 md:py-20">
      <div className="container-verlin">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
          {props.subtitle ? (
            <p className="mt-3 text-sm text-text-secondary md:text-base">{props.subtitle}</p>
          ) : null}
        </div>
        <div className="mx-auto mt-10 max-w-3xl">
          <Accordion items={props.items} />
        </div>
      </div>
    </section>
  );
}