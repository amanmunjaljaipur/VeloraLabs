import { PageHeader } from "@/components/layout/PageHeader";
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

  const library = getLibraryItems();
  const related = library.filter((item) => model.relatedSlugs.includes(item.slug));

  return (
    <>
      <PageHeader title={model.name} subtitle={model.shortDescription}>
        <Badge variant="difficulty">{model.difficulty}</Badge>
      </PageHeader>

      <section className="pb-16">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <Card>
            <p className="text-foreground leading-relaxed text-lg">{model.description}</p>
          </Card>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <h2 className="text-2xl font-semibold mb-8">Related Content</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Card key={item.id} hover>
                  <Badge variant="difficulty" className="mb-2">{item.level}</Badge>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{item.description}</p>
                </Card>
              ))}
            </div>
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