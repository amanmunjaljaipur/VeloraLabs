import type { CalloutBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";

const STYLES: Record<CalloutBlockProps["variant"], string> = {
  info: "border-teal/40 bg-teal/10",
  tip: "border-accent-teal/40 bg-accent-teal/10",
  warning: "border-amber-500/40 bg-amber-500/10",
  success: "border-emerald-500/40 bg-emerald-500/10",
};

export function CalloutBlockView({ props }: { props: CalloutBlockProps }) {
  return (
    <section className="container-verlin py-6 md:py-8">
      <aside
        className={cn(
          "mx-auto max-w-3xl rounded-2xl border px-5 py-4 md:px-6 md:py-5",
          STYLES[props.variant] ?? STYLES.info
        )}
        role="note"
      >
        {props.title ? <p className="text-sm font-semibold text-foreground">{props.title}</p> : null}
        {props.body ? (
          <p className={cn("text-sm text-text-secondary", props.title && "mt-1")}>{props.body}</p>
        ) : null}
      </aside>
    </section>
  );
}
