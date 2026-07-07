import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { getLatestNewsletterEditionCached } from "@/lib/news-updates";
import { staticPageMetadata } from "@/lib/page-metadata";
import { formatContentDateTime } from "@/lib/utils";
import Link from "next/link";

export const metadata = staticPageMetadata("newsletterWeekly", "/newsletter/weekly");

export default function WeeklyNewsletterPage() {
  const edition = getLatestNewsletterEditionCached();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Newsletter", href: "/newsletter" },
    { label: "Weekly edition" },
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

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/newsletter/weekly" />
      <PageHeader breadcrumbs={breadcrumbs} title={edition.title} subtitle={edition.intro} />
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <p className="mb-8 text-sm text-text-secondary">
            Published {formatContentDateTime(edition.publishedAt)}
            {" · "}
            {edition.itemCount} {edition.itemCount === 1 ? "story" : "stories"}
          </p>
          <div dangerouslySetInnerHTML={{ __html: edition.html }} />
          <div className="mt-12 rounded-2xl border border-teal/20 bg-teal/5 p-6 text-center">
            <p className="font-medium text-foreground">Want this in your inbox?</p>
            <p className="mt-2 text-sm text-text-secondary">
              Subscribe on our homepage for weekly mental models and AI clarity.
            </p>
            <Link href="/newsletter" className="mt-4 inline-block text-teal hover:underline">
              Subscribe →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}