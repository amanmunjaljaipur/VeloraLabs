import { PageHeader } from "@/components/layout/PageHeader";
import { Newsletter } from "@/components/sections/Newsletter";
import { getSiteConfig } from "@/lib/content";
import { getLatestNewsletterEdition } from "@/lib/news-updates";
import { createMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata = createMetadata({
  title: "Newsletter",
  description:
    "Subscribe to the Verlin Labs weekly newsletter — mental models, AI clarity, and technology insights in your inbox.",
  path: "/newsletter",
});

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const site = getSiteConfig();
  const latestEdition = await getLatestNewsletterEdition();

  return (
    <>
      <PageHeader
        eyebrow="Newsletter"
        title="Weekly clarity on AI and technology"
        subtitle="Mental models, frameworks, and practical insights — delivered every Sunday. No hype, no noise."
        align="center"
        compact
      />

      <Newsletter
        title={site.newsletter.title}
        description={site.newsletter.description}
        cta={site.newsletter.cta}
      />

      <section className="section-y border-t border-border bg-muted/15">
        <div className="container-verlin mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="text-xl font-semibold text-foreground md:text-2xl">Latest edition</h2>
          {latestEdition ? (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8">
              <p className="text-sm text-text-secondary">
                {new Date(latestEdition.publishedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{latestEdition.title}</h3>
              <p className="mt-3 leading-relaxed text-text-secondary">{latestEdition.intro}</p>
              <Link
                href="/newsletter/weekly"
                className="mt-5 inline-flex text-sm font-medium text-teal hover:underline"
              >
                Read the full edition →
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-text-secondary">
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