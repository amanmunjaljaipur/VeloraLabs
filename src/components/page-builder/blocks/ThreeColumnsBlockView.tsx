import type { ThreeColumnsBlockProps } from "@/lib/cms/page-builder-types";

export function ThreeColumnsBlockView({ props }: { props: ThreeColumnsBlockProps }) {
  return (
    <section className="container-verlin py-10 md:py-14">
      <div className="grid gap-8 md:grid-cols-3">
        {[props.col1Html, props.col2Html, props.col3Html].map((html, i) => (
          <div key={i} className="cms-rich-prose" dangerouslySetInnerHTML={{ __html: html }} />
        ))}
      </div>
    </section>
  );
}
