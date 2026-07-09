import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { CardsBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

const COLS: Record<CardsBlockProps["columns"], string> = {
  "2": "md:grid-cols-2",
  "3": "md:grid-cols-3",
  "4": "md:grid-cols-2 xl:grid-cols-4",
};

export function CardsBlockView({ props }: { props: CardsBlockProps }) {
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
      <div className={cn("mt-10 grid gap-5", COLS[props.columns] ?? COLS["3"])}>
        {props.items.map((item, index) => (
          <Card key={`${item.title}-${index}`} className="flex h-full flex-col overflow-hidden p-0">
            {item.image ? (
              <div className="relative aspect-[16/10] bg-muted/30">
                <OptimizedImage
                  src={item.image}
                  alt={item.imageAlt || item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm text-text-secondary">{item.description}</p>
              {item.linkLabel && item.linkHref ? (
                <div className="mt-4">
                  <ButtonLink href={item.linkHref} size="sm" variant="secondary">
                    {item.linkLabel}
                  </ButtonLink>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
