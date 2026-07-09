import type { PageHeaderBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

export function PageHeaderBlockView({ props }: { props: PageHeaderBlockProps }) {
  const centered = props.align === "center";

  return (
    <section className="border-b border-border bg-hero-mesh py-14 md:py-20">
      <div className={cn("container-verlin", centered && "text-center")}>
        {props.eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            {props.eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          {props.title}
        </h1>
        {props.subtitle ? (
          <p
            className={cn(
              "mt-4 max-w-2xl text-base text-text-secondary md:text-lg",
              centered && "mx-auto"
            )}
          >
            {props.subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}
