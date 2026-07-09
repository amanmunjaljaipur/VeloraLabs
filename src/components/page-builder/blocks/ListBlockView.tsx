import type { ListBlockProps } from "@/lib/cms/page-builder-types";
import { Check } from "lucide-react";

export function ListBlockView({ props }: { props: ListBlockProps }) {
  if (!props.items?.length) return null;

  return (
    <section className="container-verlin py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        {props.title ? (
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">{props.title}</h2>
        ) : null}
        {props.style === "numbered" ? (
          <ol className="list-decimal space-y-3 pl-5 text-text-secondary">
            {props.items.map((item, i) => (
              <li key={i} className="pl-1 text-sm md:text-base">
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ol>
        ) : props.style === "check" ? (
          <ul className="space-y-3">
            {props.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm md:text-base">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="list-disc space-y-3 pl-5 text-text-secondary">
            {props.items.map((item, i) => (
              <li key={i} className="pl-1 text-sm md:text-base">
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
