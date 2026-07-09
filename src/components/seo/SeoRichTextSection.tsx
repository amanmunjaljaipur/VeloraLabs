import Link from "next/link";
import type { SeoRichBlock } from "@/lib/seo-content";

export function SeoRichTextSection({ block }: { block: SeoRichBlock }) {
  return (
    <section
      aria-labelledby="seo-rich-text-heading"
      className="border-t border-border/80 bg-muted/15"
    >
      <div className="container-verlin section-y py-12 md:py-16">
        <h2
          id="seo-rich-text-heading"
          className="max-w-3xl text-xl font-semibold tracking-tight text-foreground md:text-2xl"
        >
          {block.title}
        </h2>
        <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-text-secondary md:text-base">
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
        {block.links && block.links.length > 0 ? (
          <nav aria-label="Related pages" className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Explore next
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {block.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-teal hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </section>
  );
}