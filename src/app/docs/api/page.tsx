import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { noIndexMetadata } from "@/lib/page-metadata";
import Link from "next/link";

export const metadata = noIndexMetadata(
  "API Reference | Verlin Labs Docs",
  "Public read-only API reference for the Verlin Labs mental-models endpoint.",
  "/docs/api"
);

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "/docs" },
  { label: "API Reference" },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-navy p-4 text-xs leading-relaxed text-white/90 md:text-sm">
      <code>{children}</code>
    </pre>
  );
}

const listExample = `GET https://www.verlinlabs.com/api/public/mental-models

{
  "success": true,
  "count": 12,
  "models": [
    {
      "slug": "map-vs-territory",
      "name": "Map vs. Territory",
      "shortDescription": "Your model of a system is never the system itself.",
      "difficulty": "Beginner",
      "readTime": "4 min",
      "publicUrl": "https://www.verlinlabs.com/mental-models/map-vs-territory"
    }
  ]
}`;

const detailExample = `GET https://www.verlinlabs.com/api/public/mental-models?slug=map-vs-territory

{
  "success": true,
  "model": {
    "slug": "map-vs-territory",
    "name": "Map vs. Territory",
    "shortDescription": "...",
    "description": "...",
    "difficulty": "Beginner",
    "readTime": "4 min",
    "whyItMatters": "...",
    "keyPrinciples": ["...", "..."],
    "howToApply": ["...", "..."],
    "examples": [{ "title": "...", "description": "..." }],
    "commonMistakes": ["...", "..."],
    "keyTakeaway": "...",
    "publicUrl": "https://www.verlinlabs.com/mental-models/map-vs-territory"
  }
}`;

export default function ApiDocsPage() {
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/docs/api" />
      <PageHeader breadcrumbs={breadcrumbs} eyebrow="Docs" title="API Reference" compact />

      <section className="section-y pt-0">
        <div className="container-verlin max-w-3xl">
          <div className="prose-verlin space-y-10 text-sm leading-relaxed text-text-secondary md:text-base">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Overview</h2>
              <p className="mt-2">
                One public endpoint, read-only, no authentication and no API key. Rate limits may
                apply if usage grows abusive; for a higher-throughput or write-enabled feed, see{" "}
                <Link href="/corporate" className="font-medium text-teal hover:underline">
                  Corporate plans
                </Link>
                .
              </p>
              <p className="mt-2">
                Base URL: <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">https://www.verlinlabs.com</code>
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">GET /api/public/mental-models</h2>
              <p className="mt-2">
                Returns the full list of published mental models with summary fields only.
              </p>
              <div className="mt-4">
                <CodeBlock>{listExample}</CodeBlock>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">
                GET /api/public/mental-models?slug=&#123;slug&#125;
              </h2>
              <p className="mt-2">
                Returns full detail for one mental model - principles, application steps, worked
                examples, and common mistakes. 404 if the slug doesn&apos;t exist.
              </p>
              <div className="mt-4">
                <CodeBlock>{detailExample}</CodeBlock>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">Response headers</h2>
              <p className="mt-2">
                Responses are cached at the edge for 5 minutes (
                <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                  Cache-Control: public, max-age=300, stale-while-revalidate=3600
                </code>
                ) - safe to poll on a schedule without hitting origin every time.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">See it live</h2>
              <p className="mt-2">
                <Link href="/demo" className="font-medium text-teal hover:underline">
                  /demo
                </Link>{" "}
                is a reference implementation of this exact API, rendered as an interactive tool.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
