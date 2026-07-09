import type { RichTextBlockProps } from "@/lib/cms/page-builder-types";

export function RichTextBlockView({ props }: { props: RichTextBlockProps }) {
  return (
    <section className="container-verlin py-10 md:py-14">
      <div
        className="cms-rich-prose mx-auto max-w-3xl"
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
    </section>
  );
}