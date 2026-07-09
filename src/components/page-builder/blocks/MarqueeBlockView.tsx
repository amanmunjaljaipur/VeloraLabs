import type { MarqueeBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

const SPEED: Record<MarqueeBlockProps["speed"], string> = {
  slow: "animate-marquee-slow",
  normal: "animate-marquee",
  fast: "animate-marquee",
};

export function MarqueeBlockView({ props }: { props: MarqueeBlockProps }) {
  if (!props.items?.length) return null;
  const doubled = [...props.items, ...props.items];

  return (
    <section className="overflow-hidden border-y border-border bg-muted/20 py-4" aria-label="Topics">
      <div className={cn("flex w-max gap-8 whitespace-nowrap", SPEED[props.speed] ?? SPEED.normal)}>
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="text-sm font-semibold uppercase tracking-[0.16em] text-text-secondary"
          >
            {item}
            <span className="ml-8 text-teal" aria-hidden="true">
              ·
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
