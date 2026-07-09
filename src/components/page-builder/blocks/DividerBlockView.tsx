import type { DividerBlockProps } from "@/lib/cms/page-builder-types";

export function DividerBlockView({ props }: { props: DividerBlockProps }) {
  if (props.style === "none") {
    return <div className="h-px w-full" aria-hidden="true" />;
  }

  if (props.style === "dots") {
    return (
      <div className="container-verlin py-6" role="separator">
        <div className="flex items-center justify-center gap-2 text-text-muted">
          <span aria-hidden="true">·</span>
          <span aria-hidden="true">·</span>
          <span aria-hidden="true">·</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-verlin py-6" role="separator">
      {props.label ? (
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            {props.label}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      ) : (
        <div className="h-px w-full bg-border" />
      )}
    </div>
  );
}
