import type { ColumnsBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

const RATIO_CLASS: Record<ColumnsBlockProps["ratio"], string> = {
  "1-1": "md:grid-cols-2",
  "2-1": "md:grid-cols-[2fr_1fr]",
  "1-2": "md:grid-cols-[1fr_2fr]",
};

export function ColumnsBlockView({ props }: { props: ColumnsBlockProps }) {
  return (
    <section className="container-verlin py-10 md:py-14">
      <div className={cn("grid gap-8", RATIO_CLASS[props.ratio] ?? RATIO_CLASS["1-1"])}>
        <div
          className="cms-rich-prose"
          dangerouslySetInnerHTML={{ __html: props.leftHtml }}
        />
        <div
          className="cms-rich-prose"
          dangerouslySetInnerHTML={{ __html: props.rightHtml }}
        />
      </div>
    </section>
  );
}
