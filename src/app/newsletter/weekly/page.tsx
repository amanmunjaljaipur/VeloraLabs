import { PageHeader } from "@/components/layout/PageHeader";
import { getLatestNewsletterEdition, getNewsletterEditionBySlug } from "@/lib/news-updates";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Weekly Newsletter",
  description: "Verlin Labs weekly clarity-first AI and technology roundup.",
};

export const dynamic = "force-dynamic";

export default async function WeeklyNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ edition?: string }>;
}) {
  const params = await searchParams;
  const edition = params.edition
    ? await getNewsletterEditionBySlug(params.edition)
    : await getLatestNewsletterEdition();

  if (!edition) {
    return (
      <>
        <PageHeader
          title="Weekly Newsletter"
          subtitle="Our Sunday roundup of clarity-first AI and technology news."
        />
        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
            <p className="text-text-secondary">
              The first edition hasn&apos;t been published yet. Check back this Sunday.
            </p>
            <Link href="/#newsletter" className="mt-6 inline-block text-teal hover:underline">
              Subscribe for updates →
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title={edition.title} subtitle={edition.intro} />
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <p className="mb-8 text-sm text-text-secondary">
            Published {new Date(edition.publishedAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {" · "}
            {edition.itemCount} {edition.itemCount === 1 ? "story" : "stories"}
          </p>
          <div dangerouslySetInnerHTML={{ __html: edition.html }} />
          <div className="mt-12 rounded-2xl border border-teal/20 bg-teal/5 p-6 text-center">
            <p className="font-medium text-foreground">Want this in your inbox?</p>
            <p className="mt-2 text-sm text-text-secondary">
              Subscribe on our homepage for weekly mental models and AI clarity.
            </p>
            <Link href="/#newsletter" className="mt-4 inline-block text-teal hover:underline">
              Subscribe →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}