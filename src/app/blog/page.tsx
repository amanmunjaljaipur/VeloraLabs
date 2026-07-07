import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { getLearnContentLastUpdated, getLibraryItems } from "@/lib/content";
import { formatContentDateTime } from "@/lib/utils";
import { BlogCollectionJsonLd } from "@/components/seo/BlogCollectionJsonLd";
import { staticPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { BlogClient } from "./BlogClient";

const SEMANTIC_HUBS = [
  {
    title: "LLMs for product discovery",
    href: "/learn/llms-for-product-discovery",
    keywords: ["PM discovery", "LLM synthesis", "PRD drafting"],
  },
  {
    title: "AI roadmap for non-technical PMs",
    href: "/learn/ai-roadmap-for-non-technical-pms",
    keywords: ["PM AI literacy", "vendor evaluation", "MVP"],
  },
  {
    title: "AI for school students",
    href: "/learn/ai-for-school-students",
    keywords: ["Classes 6–12", "safe AI use", "mental models"],
  },
] as const;

const TOPIC_CLUSTERS = [
  {
    title: "AI fundamentals",
    href: "/library/how-llms-work",
    keywords: ["LLMs", "tokens", "transformers"],
  },
  {
    title: "Product management & AI",
    href: "/library/how-to-learn-ai-for-product-management",
    keywords: ["PM training", "AI discovery", "MVP"],
  },
  {
    title: "Students & beginners",
    href: "/library/chatgpt-for-students",
    keywords: ["school students", "safe AI use"],
  },
  {
    title: "Engineering & builders",
    href: "/library/vector-search-rag-in-practice",
    keywords: ["RAG", "embeddings", "portfolio"],
  },
  {
    title: "Mental models",
    href: "/mental-models",
    keywords: ["frameworks", "clarity-first"],
  },
] as const;

export const metadata = staticPageMetadata("blog", "/blog");

export default function BlogPage() {
  const posts = getLibraryItems().filter((item) =>
    ["Article", "Guide", "Workshop"].includes(item.type)
  );
  const lastUpdated = getLearnContentLastUpdated();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Blog" },
  ];

  return (
    <>
      <BlogCollectionJsonLd />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/blog" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Blog"
        title="Ideas worth understanding"
        subtitle="Clarity-first articles on AI fundamentals, product thinking, and the mental models that make complex technology stick."
        align="center"
        compact
      />
      <section className="border-b border-border/80 bg-muted/20 py-10">
        <div className="container-verlin">
          <h2 className="text-lg font-semibold text-foreground">Answer hubs (long-tail)</h2>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Question-based guides that link directly to Verlin Labs course tracks.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {SEMANTIC_HUBS.map((hub) => (
              <Link
                key={hub.href}
                href={hub.href}
                className="rounded-2xl border border-accent-teal/25 bg-card p-5 transition-colors hover:border-accent-teal/50"
              >
                <p className="font-semibold text-foreground">{hub.title}</p>
                <p className="mt-2 text-xs text-text-secondary">{hub.keywords.join(" · ")}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b border-border/80 bg-muted/10 py-10">
        <div className="container-verlin">
          <h2 className="text-lg font-semibold text-foreground">Explore by topic</h2>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Keyword-focused clusters — long-form guides and articles from the Verlin Labs content hub.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPIC_CLUSTERS.map((cluster) => (
              <Link
                key={cluster.href}
                href={cluster.href}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent-teal/40"
              >
                <p className="font-semibold text-foreground">{cluster.title}</p>
                <p className="mt-2 text-xs text-text-secondary">
                  {cluster.keywords.join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <div className="container-verlin -mt-6 mb-2 flex justify-center">
        <p className="text-sm text-text-secondary">
          {posts.length} articles and guides
          {lastUpdated && (
            <> · Last updated {formatContentDateTime(lastUpdated)}</>
          )}
          {" · "}
          <a href="/library" className="font-medium text-teal hover:underline">
            Explore full library
          </a>
        </p>
      </div>
      <BlogClient posts={posts} />
    </>
  );
}