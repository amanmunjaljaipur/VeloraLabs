import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewsletterEditionList } from "@/components/newsletter/NewsletterEditionList";
import { listPublishedNewsletterEditions } from "@/lib/news-updates";
import { staticPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";

export const metadata = staticPageMetadata("newsletterArchive", "/newsletter/archive");

export default async function NewsletterArchivePage() {
  const editions = await listPublishedNewsletterEditions();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Newsletter", href: "/newsletter" },
    { label: "Archive" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/newsletter/archive" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Newsletter archive"
        subtitle="Browse every published weekly edition — organized by Sunday week in India Standard Time."
        compact
      />
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          {editions.length > 0 ? (
            <NewsletterEditionList editions={editions} />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-text-secondary">
                Editions will appear here after the first Sunday publish.
              </p>
              <Link href="/newsletter" className="mt-4 inline-block text-teal hover:underline">
                Subscribe for the next edition →
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}