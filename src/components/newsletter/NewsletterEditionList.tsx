import type { CompiledNewsletter } from "@/lib/newsletter-compile";
import { formatWeekHeading } from "@/lib/news-week";
import { formatContentStamp } from "@/lib/utils";
import Link from "next/link";

interface NewsletterEditionListProps {
  editions: CompiledNewsletter[];
  showWeekHeading?: boolean;
}

export function NewsletterEditionList({
  editions,
  showWeekHeading = true,
}: NewsletterEditionListProps) {
  if (editions.length === 0) {
    return (
      <p className="text-text-secondary">
        No published editions yet. Subscribe above to get the first one in your inbox.
      </p>
    );
  }

  let lastWeekOf = "";

  return (
    <div className="space-y-4">
      {editions.map((edition) => {
        const showHeading = showWeekHeading && edition.weekOf !== lastWeekOf;
        lastWeekOf = edition.weekOf;

        return (
          <div key={edition.slug}>
            {showHeading && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-teal">
                {formatWeekHeading(edition.weekOf)}
              </p>
            )}
            <Link
              href={`/newsletter/weekly?edition=${encodeURIComponent(edition.slug)}`}
              className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-teal/30 hover:bg-teal/5 md:p-6"
            >
              <p className="text-sm text-text-secondary">
                Published {formatContentStamp(edition.publishedAt)}
                {" · "}
                {edition.itemCount} {edition.itemCount === 1 ? "story" : "stories"}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{edition.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                {edition.intro}
              </p>
              <span className="mt-4 inline-flex text-sm font-medium text-teal">
                Read edition →
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}