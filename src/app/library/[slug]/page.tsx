import { LibraryArticle } from "@/components/sections/LibraryArticle";
import { ContentCard } from "@/components/sections/ContentCard";
import { Button } from "@/components/ui/Button";
import { getLibraryItem, getLibraryItems } from "@/lib/content";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getLibraryItems().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getLibraryItem(slug);
  if (!item) return { title: "Not Found" };
  return { title: item.title, description: item.description };
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

  return (
    <>
      <LibraryArticle item={item} />

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