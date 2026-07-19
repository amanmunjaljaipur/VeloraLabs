import { PageHeader } from "@/components/layout/PageHeader";
import { buildSitemapSections } from "@/lib/site-sitemap";
import { staticPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";

export const metadata = staticPageMetadata("sitemap", "/sitemap");

export default function SitemapPage() {
  const sections = buildSitemapSections();

  return (
    <>
      <PageHeader
        eyebrow="Site"
        title="Sitemap"
        subtitle="A structured index of every main page on Verlin Labs - for learners, teams, and search engines."
        align="center"
        compact
      />

      <section className="section-y">
        <div className="container-verlin !max-w-4xl space-y-12">
          {sections.map((section) => (
            <div key={section.id}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {section.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group block rounded-xl border border-border bg-card p-4 transition-colors hover:border-teal/30 hover:bg-muted/30"
                    >
                      <p className="font-medium text-foreground group-hover:text-teal">
                        {link.label}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                        {link.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}