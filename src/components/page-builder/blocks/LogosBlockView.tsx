import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { LogosBlockProps } from "@/lib/cms/page-builder-types";

export function LogosBlockView({ props }: { props: LogosBlockProps }) {
  return (
    <section className="border-y border-border bg-muted/15 py-10 md:py-14">
      <div className="container-verlin text-center">
        {props.title ? (
          <h2 className="text-lg font-semibold tracking-tight md:text-xl">{props.title}</h2>
        ) : null}
        {props.subtitle ? (
          <p className="mt-2 text-sm text-text-secondary">{props.subtitle}</p>
        ) : null}
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {props.items.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex h-12 items-center">
              {item.image ? (
                item.href ? (
                  <a href={item.href} className="relative block h-10 w-28 grayscale transition hover:grayscale-0">
                    <OptimizedImage
                      src={item.image}
                      alt={item.imageAlt || item.name}
                      fill
                      className="object-contain"
                      sizes="112px"
                    />
                  </a>
                ) : (
                  <span className="relative block h-10 w-28 grayscale">
                    <OptimizedImage
                      src={item.image}
                      alt={item.imageAlt || item.name}
                      fill
                      className="object-contain"
                      sizes="112px"
                    />
                  </span>
                )
              ) : (
                <span className="rounded-lg border border-dashed border-border px-4 py-2 text-xs font-medium text-text-muted">
                  {item.name || "Logo"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
