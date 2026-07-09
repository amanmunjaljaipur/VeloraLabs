import type { StatsBlockProps } from "@/lib/cms/page-builder-types";

export function StatsBlockView({ props }: { props: StatsBlockProps }) {
  if (!props.items?.length) return null;

  return (
    <section className="border-y border-border/80 bg-muted/25 py-10 md:py-14">
      <div className="container-verlin">
        <div
          className="grid grid-cols-2 gap-8 md:grid-cols-4"
          role="list"
          aria-label="Key statistics"
        >
          {props.items.map((stat, index) => (
            <div key={`${stat.label}-${index}`} className="text-center" role="listitem">
              <p className="text-3xl font-semibold text-teal md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
