import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewsletterEditionList } from "@/components/newsletter/NewsletterEditionList";
import {
  getLatestNewsletterEdition,
  getNewsletterEditionBySlug,
  listPublishedNewsletterEditions,
} from "@/lib/news-updates";
import { formatWeekHeading } from "@/lib/news-week";
import { staticPageMetadata } from "@/lib/page-metadata";
import { formatContentDateTime } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = staticPageMetadata("newsletterWeekly", "/newsletter/weekly");

interface WeeklyNewsletterPageProps {
  searchParams: Promise<{ edition?: string }>;
}

export default async function WeeklyNewsletterPage({ searchParams }: WeeklyNewsletterPageProps) {
  const { edition: editionSlug } = await searchParams;
  const allEditions = await listPublishedNewsletterEditions();

  const edition = editionSlug
    ? await getNewsletterEditionBySlug(editionSlug)
    : await getLatestNewsletterEdition();

  if (editionSlug && !edition) {
    notFound();
  }

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Newsletter", href: "/newsletter" },
    { label: edition ? "Weekly edition" : "Weekly edition" },
  ];

  if (!edition) {
    return (
      <>
        <BreadcrumbJsonLd items={breadcrumbs} currentPath="/newsletter/weekly" />
        <PageHeader
          breadcrumbs={breadcrumbs}
          title="Weekly Newsletter"
          subtitle="Our Sunday roundup of clarity-first AI and technology news."
        />
        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
            <p className="text-text-secondary">
              The first edition hasn&apos;t been published yet. Check back this Sunday.
            </p>
            <Link href="/newsletter" className="mt-6 inline-block text-teal hover:underline">
              Subscribe for updates →
            </Link>
          </div>
        </section>
      </>
    );
  }

  const otherEditions = allEditions.filter((item) => item.slug !== edition.slug).slice(0, 4);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/newsletter/weekly" />
      <PageHeader breadcrumbs={breadcrumbs} title={edition.title} subtitle={edition.intro} />
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <p className="mb-2 text-sm font-medium text-teal">{formatWeekHeading(edition.weekOf)}</p>
          <p className="mb-8 text-sm text-text-secondary">
            Published {formatContentDateTime(edition.publishedAt)}
            {" · "}
            {edition.itemCount} {edition.itemCount === 1 ? "story" : "stories"}
          </p>
          <div dangerouslySetInnerHTML={{ __html: edition.html }} />
          <div className="mt-12 rounded-2xl border border-teal/20 bg-teal/5 p-6 text-center">
            <p className="font-medium text-foreground">Want this in your inbox every Sunday?</p>
            <p className="mt-2 text-sm text-text-secondary">
              Subscribe only if you want the weekly PDF — we won&apos;t add you automatically when
              you sign in.
            </p>
            <Link href="/newsletter" className="mt-4 inline-block text-teal hover:underline">
              Subscribe →
            </Link>
          </div>

          {otherEditions.length > 0 && (
            <div className="mt-14 border-t border-border pt-10">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-foreground">More weekly editions</h2>
                <Link href="/newsletter/archive" className="text-sm text-teal hover:underline">
                  View all →
                </Link>
              </div>
              <NewsletterEditionList editions={otherEditions} showWeekHeading={false} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}