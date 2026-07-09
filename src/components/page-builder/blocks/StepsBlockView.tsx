import type { StepsBlockProps } from "@/lib/cms/page-builder-types";

export function StepsBlockView({ props }: { props: StepsBlockProps }) {
  return (
    <section className="container-verlin py-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        {props.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">{props.eyebrow}</p>
        ) : null}
        <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
        {props.subtitle ? (
          <p className="mt-3 text-sm text-text-secondary md:text-base">{props.subtitle}</p>
        ) : null}
      </div>
      <ol className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
        {props.items.map((item, index) => (
          <li key={`${item.title}-${index}`} className="relative rounded-2xl border border-border bg-card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/15 text-sm font-bold text-teal">
              {index + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
