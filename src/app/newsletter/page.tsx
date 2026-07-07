import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewsletterEditionList } from "@/components/newsletter/NewsletterEditionList";
import { Newsletter } from "@/components/sections/Newsletter";
import { getSiteConfig } from "@/lib/content";
import { listPublishedNewsletterEditions } from "@/lib/news-updates";
import { formatContentDateTime } from "@/lib/utils";
import { staticPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";

export const metadata = staticPageMetadata("newsletter", "/newsletter");

export default async function NewsletterPage() {
  const site = getSiteConfig();
  const editions = await listPublishedNewsletterEditions();
  const latestEdition = editions[0] ?? null;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Newsletter" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/newsletter" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Newsletter"
        title="Weekly clarity on AI and technology"
        subtitle="Mental models, frameworks, and practical insights — published every Sunday (IST). Subscribe only when you want it in your inbox."
        align="center"
        compact
      />

      <Newsletter
        title={site.newsletter.title}
        description={site.newsletter.description}
        cta={site.newsletter.cta}
        subscribeSource="Newsletter page"
      />

      <section className="section-y border-t border-border bg-muted/15">
        <div className="container-verlin mx-auto max-w-3xl px-4 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                Published editions
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Read any past weekly roundup online — no subscription required.
              </p>
            </div>
            {editions.length > 0 && (
              <Link href="/newsletter/archive" className="text-sm font-medium text-teal hover:underline">
                Full archive →
              </Link>
            )}
          </div>

          {latestEdition && (
            <div className="mt-6 rounded-2xl border border-teal/20 bg-teal/5 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
                Latest edition
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Published {formatContentDateTime(latestEdition.publishedAt)}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{latestEdition.title}</h3>
              <p className="mt-3 leading-relaxed text-text-secondary">{latestEdition.intro}</p>
              <Link
                href={`/newsletter/weekly?edition=${encodeURIComponent(latestEdition.slug)}`}
                className="mt-5 inline-flex text-sm font-medium text-teal hover:underline"
              >
                Read the full edition →
              </Link>
            </div>
          )}

          {editions.length > 1 && (
            <div className="mt-10">
              <h3 className="text-base font-semibold text-foreground">Previous weeks</h3>
              <div className="mt-4">
                <NewsletterEditionList editions={editions.slice(1, 5)} showWeekHeading={false} />
              </div>
            </div>
          )}

          {editions.length === 0 && (
            <p className="mt-6 text-text-secondary">
              The first edition is on its way. Subscribe above to get it in your inbox.
            </p>
          )}

          <div className="mt-10 rounded-2xl border border-accent-teal/20 bg-accent-teal/5 p-6 text-center">
            <p className="font-medium text-foreground">Watch on YouTube</p>
            <p className="mt-2 text-sm text-text-secondary">
              Follow Verlin Labs for explainers, sessions, and learning content.
            </p>
            <a
              href="https://youtube.com/@verlinlabs?si=8HP1JaV5lprlc7zp"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-medium text-teal hover:underline"
            >
              @verlinlabs on YouTube →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}