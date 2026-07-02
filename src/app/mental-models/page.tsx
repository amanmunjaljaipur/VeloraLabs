import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getMentalModels } from "@/lib/content";
import { Clock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mental Models Hub",
  description: "In-depth frameworks for understanding complex ideas with clarity — principles, examples, and practical application.",
};

export default function MentalModelsPage() {
  const models = getMentalModels();

  return (
    <>
      <PageHeader
        title="Mental Models Hub"
        subtitle="Reusable frameworks with full explanations, real-world examples, and step-by-step application — not just definitions."
      />

      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
            Each model includes an overview, key principles, how to apply it, examples, common mistakes,
            and a concise takeaway — structured like professional concept guides used in top learning
            platforms.
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-24 pt-10">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <Link key={model.slug} href={`/mental-models/${model.slug}`} className="group block h-full">
                <Card hover className="flex h-full flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="difficulty">{model.difficulty}</Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                      <Clock className="h-3.5 w-3.5" />
                      {model.readTime}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-teal transition-colors">
                    {model.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-text-secondary leading-relaxed">
                    {model.shortDescription}
                  </p>
                  <p className="mt-4 text-xs font-medium text-teal opacity-0 transition-opacity group-hover:opacity-100">
                    Read full guide →
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