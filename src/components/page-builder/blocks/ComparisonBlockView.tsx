import type { ComparisonBlockProps } from "@/lib/cms/page-builder-types";

export function ComparisonBlockView({ props }: { props: ComparisonBlockProps }) {
  return (
    <section className="container-verlin py-14 md:py-20">
      <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
      <div className="mx-auto max-w-4xl overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Feature
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {props.columnA}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-teal">
                {props.columnB}
              </th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, i) => (
              <tr key={i} className="border-t border-border">
                <th scope="row" className="px-4 py-3 font-medium text-foreground">
                  {row.feature}
                </th>
                <td className="px-4 py-3 text-text-secondary">{row.colA}</td>
                <td className="px-4 py-3 font-medium text-foreground">{row.colB}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
