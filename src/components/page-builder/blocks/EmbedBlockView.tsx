import type { EmbedBlockProps } from "@/lib/cms/page-builder-types";

export function EmbedBlockView({ props }: { props: EmbedBlockProps }) {
  if (!props.html?.trim()) {
    return (
      <section className="container-verlin py-8">
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
          Add embed HTML or an iframe in the component properties.
        </div>
      </section>
    );
  }

  const minH = Number(props.minHeight) || 320;

  return (
    <section className="container-verlin py-8 md:py-12">
      <div
        className="overflow-hidden rounded-2xl border border-border bg-muted/20"
        style={{ minHeight: minH }}
        title={props.title || "Embedded content"}
        // CMS-authored embed — admin-only editors; same trust model as rich text
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
    </section>
  );
}
