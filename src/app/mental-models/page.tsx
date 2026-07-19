import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { CourseTrackLinks } from "@/components/sections/CourseTrackLinks";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getLearnContentLastUpdated, getMentalModels } from "@/lib/content";
import { formatContentDateTime, formatContentStamp } from "@/lib/utils";
import { staticPageMetadata } from "@/lib/page-metadata";
import { Clock } from "lucide-react";
import Link from "next/link";
import { CollectionPageJsonLd } from "@/components/seo/CollectionPageJsonLd";
import { SeoRichTextSection } from "@/components/seo/SeoRichTextSection";
import { MENTAL_MODELS_SEO_BLOCK } from "@/lib/seo-content";

export const metadata = staticPageMetadata("mentalModels", "/mental-models");

export default function MentalModelsPage() {
  const models = [...getMentalModels()].sort((a, b) =>
    (b.updatedAt ?? b.publishedAt ?? "").localeCompare(a.updatedAt ?? a.publishedAt ?? "")
  );
  const lastUpdated = getLearnContentLastUpdated();
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Learn", href: "/resources" },
    { label: "Mental Models" },
  ];

  return (
    <>
      <CollectionPageJsonLd
        name="Verlin Labs AI Mental Models"
        description={MENTAL_MODELS_SEO_BLOCK.paragraphs[0]!}
        path="/mental-models"
        items={models.map((model) => ({
          name: model.name,
          url: `/mental-models/${model.slug}`,
          description: model.shortDescription,
        }))}
      />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/mental-models" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Frameworks"
        title="Mental Models Hub"
        subtitle="Reusable frameworks with full explanations, real-world examples, and step-by-step application - not just definitions."
        image="/images/brand-mental-models-hub.jpg"
        imageAlt="Reusable frameworks - Systems, Trade-offs, and Mental Models, the three lenses applied to every new problem"
        imageFit="contain"
      />

      <section className="border-b border-border/80 bg-muted/20">
        <div className="container-verlin py-8">
          <p className="max-w-3xl text-body text-sm">
            Each model includes an overview, key principles, how to apply it, examples, common mistakes,
            and a concise takeaway - structured like professional concept guides used in top learning
            platforms.
            {lastUpdated && (
              <> Last updated {formatContentDateTime(lastUpdated)}.</>
            )}
          </p>
        </div>
      </section>

      <section className="section-y pt-10">
        <div className="container-verlin">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <Link key={model.slug} href={`/mental-models/${model.slug}`} className="group block h-full">
                <Card hover className="flex h-full flex-col group-hover:border-accent-teal/25">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="difficulty">{model.difficulty}</Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-teal transition-colors">
                    {model.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-text-secondary leading-relaxed">
                    {model.shortDescription}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {model.readTime}
                    </span>
                    {(model.updatedAt ?? model.publishedAt) && (
                      <>
                        <span className="text-text-muted/50" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-text-muted">
                          Updated{" "}
                          <span className="whitespace-nowrap">
                            {formatContentStamp(model.updatedAt ?? model.publishedAt!)}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-4 text-xs font-medium text-teal opacity-0 transition-opacity group-hover:opacity-100">
                    Read full guide →
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CourseTrackLinks />
      <SiteExploreLinks section="learn" excludeHref="/mental-models" />
      <SeoRichTextSection block={MENTAL_MODELS_SEO_BLOCK} />
    </>
  );
}