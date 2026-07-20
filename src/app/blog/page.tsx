import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { BlogClient } from "@/app/blog/BlogClient";
import { BlogCollectionJsonLd } from "@/components/seo/BlogCollectionJsonLd";
import {
  blogPostToLibraryItem,
  getPublishedBlogPosts,
} from "@/lib/blog/store";
import { BLOG_SEQUENCES } from "@/lib/blog/sequences";
import { getLibraryItems } from "@/lib/content";
import { staticPageMetadata } from "@/lib/page-metadata";
import { formatContentDateTime } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = staticPageMetadata("blog", "/blog");

export default async function BlogPage() {
  const libraryPosts = getLibraryItems().filter((item) =>
    ["Article", "Guide", "Workshop"].includes(item.type)
  );
  const scheduledPublished = (await getPublishedBlogPosts()).map(blogPostToLibraryItem);

  // Prefer scheduled blog posts when slug collides; show newest first
  const bySlug = new Map<string, (typeof libraryPosts)[0] & { href?: string }>();
  for (const post of libraryPosts) {
    bySlug.set(post.slug, { ...post, href: `/blog/${post.slug}` });
  }
  for (const post of scheduledPublished) {
    bySlug.set(post.slug, { ...post, href: `/blog/${post.slug}` });
  }

  const posts = Array.from(bySlug.values()).sort((a, b) =>
    (b.updatedAt ?? b.publishedAt).localeCompare(a.updatedAt ?? a.publishedAt)
  );

  const lastUpdated = posts[0]?.updatedAt ?? posts[0]?.publishedAt ?? null;

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
        subtitle="Clarity-first articles on AI fundamentals, product thinking, and mental models - published with full date and time."
        align="center"
        compact
      />

      <section className="border-b border-border/80 bg-muted/20 py-10">
        <div className="container-verlin">
          <h2 className="text-lg font-semibold text-foreground">Daily sequences</h2>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Posts are generated and scheduled by topic sequence so the blog stays consistent over
            time.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_SEQUENCES.map((seq) => (
              <div
                key={seq.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <p className="text-sm font-semibold text-foreground">{seq.label}</p>
                <p className="mt-1 text-xs text-text-secondary">{seq.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-verlin -mt-2 mb-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-4 text-sm text-text-secondary">
        <span>{posts.length} articles</span>
        {lastUpdated ? (
          <>
            <span aria-hidden>·</span>
            <span>Latest {formatContentDateTime(lastUpdated)}</span>
          </>
        ) : null}
        <span aria-hidden>·</span>
        <Link href="/library" className="font-medium text-teal hover:underline">
          Full library
        </Link>
      </div>

      <BlogClient posts={posts} />
    </>
  );
}
