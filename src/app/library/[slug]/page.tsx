import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CourseTrackLinks } from "@/components/sections/CourseTrackLinks";
import { LibraryArticle } from "@/components/sections/LibraryArticle";
import { ContentCard } from "@/components/sections/ContentCard";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { Button } from "@/components/ui/Button";
import { getLibraryItem, getLibraryItems } from "@/lib/content";
import { trimMetaDescription } from "@/lib/meta-description";
import { createMetadata } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getLibraryItems().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getLibraryItem(slug);
  if (!item) return { title: "Not Found" };
  return createMetadata({
    title: `${item.title} — AI ${item.type}`,
    description: trimMetaDescription(
      `${item.description} ${item.duration} read · ${item.level} · Verlin Labs library.`
    ),
    keywords: [...item.tags, "AI learning", item.level, "Verlin Labs"],
    path: `/library/${slug}`,
    image: item.image,
    type: "article",
  });
}

export default async function LibraryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getLibraryItem(slug);
  if (!item) notFound();

  const allItems = getLibraryItems();
  const related = allItems.filter(
    (entry) => entry.slug !== item.slug && item.relatedSlugs.includes(entry.slug)
  );

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Library", href: "/library" },
    { label: item.title },
  ];

  return (
    <>
      <ArticleJsonLd item={item} />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath={`/library/${slug}`} />
      <div className="container-verlin border-b border-border/80 bg-hero-mesh py-4">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <LibraryArticle item={item} />

      <CourseTrackLinks
          title={
            item.audience === "professionals"
              ? "Ready for structured AI training for PMs?"
              : item.audience === "engineers"
                ? "Continue with the college engineers track"
                : item.audience === "students"
                  ? "Continue with the school students track"
                  : "Apply what you learned in a live program"
          }
          className="section-y border-t border-border bg-muted/15"
        />

      {related.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <h2 className="text-2xl font-semibold text-foreground">Related reading</h2>
            <p className="mt-2 text-text-secondary">Continue with these connected resources.</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((entry) => (
                <ContentCard key={entry.id} {...entry} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 text-center">
        <Link href="/library">
          <Button variant="secondary">← Back to library</Button>
        </Link>
      </section>
    </>
  );
}