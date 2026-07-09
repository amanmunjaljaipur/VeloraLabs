import type { TitleBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

export function TitleBlockView({ props }: { props: TitleBlockProps }) {
  const Tag = props.level || "h2";
  const size =
    Tag === "h1"
      ? "text-3xl md:text-4xl lg:text-5xl"
      : Tag === "h3"
        ? "text-xl md:text-2xl"
        : "text-2xl md:text-3xl";

  return (
    <section className="container-verlin py-6 md:py-8">
      <div className={cn(props.align === "center" && "text-center")}>
        {props.eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            {props.eyebrow}
          </p>
        ) : null}
        <Tag className={cn("font-semibold tracking-tight text-foreground", size)}>{props.text}</Tag>
      </div>
    </section>
  );
}
