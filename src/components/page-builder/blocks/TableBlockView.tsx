import type { TableBlockProps } from "@/lib/cms/page-builder-types";

export function TableBlockView({ props }: { props: TableBlockProps }) {
  if (!props.headers?.length) return null;

  return (
    <section className="container-verlin py-8 md:py-12">
      <div className="mx-auto max-w-4xl overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          {props.caption ? (
            <caption className="border-b border-border bg-muted/30 px-4 py-3 text-left text-sm font-semibold text-foreground">
              {props.caption}
            </caption>
          ) : null}
          <thead className="bg-muted/40">
            <tr>
              {props.headers.map((header, i) => (
                <th key={i} scope="col" className="px-4 py-3 font-semibold text-foreground">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, ri) => (
              <tr key={ri} className="border-t border-border">
                {props.headers.map((_, ci) => (
                  <td key={ci} className="px-4 py-3 text-text-secondary">
                    {row[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
