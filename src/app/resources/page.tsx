import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResourcesHub } from "@/components/resources/ResourcesHub";
import { ResourcesPageContent } from "@/components/resources/ResourcesPageContent";
import { staticPageMetadata } from "@/lib/page-metadata";

export const metadata = staticPageMetadata("resources", "/resources");

export default function ResourcesPage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Resources Hub" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/resources" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Resources Hub"
        subtitle="Library, blog, mental models, downloads, and curated tools - everything in one place for clarity-first learners."
        image="/images/mental-models.jpg"
        imageAlt="Learning resources and mental models"
      />
      <ResourcesHub />
      <ResourcesPageContent />
    </>
  );
}