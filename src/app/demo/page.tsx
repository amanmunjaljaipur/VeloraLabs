import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { staticPageMetadata } from "@/lib/page-metadata";
import { getMentalModels } from "@/lib/content";
import { DemoClient } from "@/app/demo/DemoClient";

export const metadata = staticPageMetadata("demo", "/demo");

const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Try it" }];

export default function DemoPage() {
  const models = getMentalModels().map((m) => ({
    slug: m.slug,
    name: m.name,
    shortDescription: m.shortDescription,
    difficulty: m.difficulty,
    readTime: m.readTime,
  }));

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/demo" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Try it live"
        title="See a mental model in action"
        subtitle="Pick a topic below and get the same clarity-first breakdown we teach in every live session - no signup required."
        compact
      />

      <section className="section-y pt-0">
        <div className="container-verlin">
          <DemoClient initialModels={models} />
        </div>
      </section>
    </>
  );
}
