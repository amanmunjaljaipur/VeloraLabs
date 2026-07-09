import type { AgendaBlockProps } from "@/lib/cms/page-builder-types";

export function AgendaBlockView({ props }: { props: AgendaBlockProps }) {
  return (
    <section className="container-verlin py-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
        {props.subtitle ? (
          <p className="mt-3 text-sm text-text-secondary md:text-base">{props.subtitle}</p>
        ) : null}
      </div>
      <ol className="mx-auto mt-10 max-w-2xl space-y-4">
        {props.items.map((item, index) => (
          <li
            key={`${item.title}-${index}`}
            className="flex gap-4 rounded-xl border border-border bg-card p-4 md:p-5"
          >
            <time className="w-14 shrink-0 font-mono text-sm font-semibold text-teal">{item.time}</time>
            <div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              {item.description ? (
                <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
