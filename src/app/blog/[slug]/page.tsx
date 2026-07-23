import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CourseTrackLinks } from "@/components/sections/CourseTrackLinks";
import { LibraryArticle } from "@/components/sections/LibraryArticle";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { Button } from "@/components/ui/Button";
import { blogPostToLibraryItem, getBlogPostBySlug } from "@/lib/blog/store";
import { getLibraryItem } from "@/lib/content";
import { trimMetaDescription } from "@/lib/meta-description";
import { createMetadata } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scheduled = await getBlogPostBySlug(slug);
  if (scheduled?.status === "published") {
    return createMetadata({
      title: `${scheduled.title} - Blog`,
      description: trimMetaDescription(scheduled.description),
      keywords: [...scheduled.tags, "Verlin Labs blog"],
      path: `/blog/${slug}`,
      image: scheduled.image,
      type: "article",
    });
  }
  const item = getLibraryItem(slug);
  if (!item) return { title: "Not Found" };
  return createMetadata({
    title: `${item.title} - Blog`,
    description: trimMetaDescription(item.description),
    keywords: [...item.tags, "Verlin Labs blog"],
    path: `/blog/${slug}`,
    image: item.image,
    type: "article",
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const scheduled = await getBlogPostBySlug(slug);
  if (scheduled && scheduled.status !== "published") {
    notFound();
  }

  const item = scheduled
    ? blogPostToLibraryItem(scheduled)
    : getLibraryItem(slug);

  if (!item) notFound();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: item.title },
  ];

  return (
    <>
      <ArticleJsonLd item={item} />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath={`/blog/${slug}`} />
      <div className="container-verlin border-b border-border/80 bg-hero-mesh py-4">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      {scheduled ? (
        <div className="border-b border-border bg-muted/20">
          <div className="container-verlin flex flex-wrap items-center gap-3 py-3 text-xs text-text-secondary">
            <span className="rounded-full bg-accent-teal/15 px-2.5 py-0.5 font-semibold uppercase tracking-wide text-accent-teal">
              Scheduled series
            </span>
            <span>{scheduled.sequenceLabel}</span>
          </div>
        </div>
      ) : null}
      <LibraryArticle item={item} basePath="/blog" />
      <CourseTrackLinks className="section-y border-t border-border bg-muted/15" />
      <section className="py-12 text-center">
        <Link href="/blog">
          <Button variant="secondary">← Back to blog</Button>
        </Link>
      </section>
    </>
  );
}
