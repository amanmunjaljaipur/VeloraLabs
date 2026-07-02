import { PageHeader } from "@/components/layout/PageHeader";
import { MentalModelArticle } from "@/components/sections/MentalModelArticle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getMentalModel, getMentalModels, getLibraryItems } from "@/lib/content";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getMentalModels().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = getMentalModel(slug);
  if (!model) return { title: "Not Found" };
  return { title: model.name, description: model.shortDescription };
}

export default async function MentalModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = getMentalModel(slug);
  if (!model) notFound();

  const allModels = getMentalModels();
  const relatedModels = allModels.filter(
    (m) => m.slug !== model.slug && model.relatedModelSlugs.includes(m.slug)
  );
  const library = getLibraryItems();
  const relatedLibrary = library.filter((item) => model.relatedSlugs.includes(item.slug));

  return (
    <>
      <PageHeader title={model.name} subtitle={model.shortDescription}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="difficulty">{model.difficulty}</Badge>
          <span className="text-sm text-text-secondary">{model.readTime}</span>
        </div>
      </PageHeader>

      <MentalModelArticle model={model} />

      {(relatedModels.length > 0 || relatedLibrary.length > 0) && (
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <h2 className="text-2xl font-semibold text-foreground">Continue exploring</h2>
            <p className="mt-2 max-w-2xl text-text-secondary">
              Related mental models and library resources that build on this framework.
            </p>

            {relatedModels.length > 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedModels.map((related) => (
                  <Link key={related.slug} href={`/mental-models/${related.slug}`} className="block h-full">
                    <Card hover className="h-full">
                      <Badge variant="difficulty" className="mb-2">
                        {related.difficulty}
                      </Badge>
                      <h3 className="font-semibold text-foreground">{related.name}</h3>
                      <p className="mt-2 text-sm text-text-secondary">{related.shortDescription}</p>
                      <p className="mt-3 text-xs font-medium text-teal">{related.readTime}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {relatedLibrary.length > 0 && (
              <div className="mt-10">
                <h3 className="text-lg font-semibold text-foreground">From the library</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedLibrary.map((item) => (
                    <Link key={item.id} href={`/library/${item.slug}`} className="block h-full">
                      <Card hover className="h-full">
                        <Badge variant="difficulty" className="mb-2">
                          {item.level}
                        </Badge>
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="mt-2 text-sm text-text-secondary">{item.description}</p>
                        <p className="mt-3 text-xs font-medium text-teal">{item.duration}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-16 text-center">
        <Link href="/mental-models">
          <Button variant="secondary">← Back to Mental Models</Button>
        </Link>
      </section>
    </>
  );
}