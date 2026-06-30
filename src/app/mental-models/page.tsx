import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getMentalModels } from "@/lib/content";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mental Models Hub",
  description: "Frameworks for understanding complex ideas with clarity.",
};

export default function MentalModelsPage() {
  const models = getMentalModels();

  return (
    <>
      <PageHeader
        title="Mental Models Hub"
        subtitle="Reusable frameworks that help you understand anything — not just memorize it."
      />

      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <Link key={model.slug} href={`/mental-models/${model.slug}`}>
                <Card hover className="h-full">
                  <Badge variant="difficulty" className="mb-3">{model.difficulty}</Badge>
                  <h3 className="text-lg font-semibold text-foreground">{model.name}</h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    {model.shortDescription}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}