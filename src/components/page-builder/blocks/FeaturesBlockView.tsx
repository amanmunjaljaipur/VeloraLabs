import { Card } from "@/components/ui/Card";
import type { FeaturesBlockProps } from "@/lib/cms/page-builder-types";

export function FeaturesBlockView({ props }: { props: FeaturesBlockProps }) {
  return (
    <section className="container-verlin section-y py-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        {props.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">{props.eyebrow}</p>
        ) : null}
        <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
        {props.subtitle ? (
          <p className="mt-3 text-sm text-text-secondary md:text-base">{props.subtitle}</p>
        ) : null}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {props.items.map((item, index) => (
          <Card key={`${item.title}-${index}`} className="h-full p-5">
            <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}