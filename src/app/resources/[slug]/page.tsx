import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { PrintButton } from "@/components/ui/PrintButton";
import { getResourceDownload, getResourceDownloadSlugs } from "@/lib/content";
import { createMetadata } from "@/lib/seo";
import { LearningResourceJsonLd } from "@/components/seo/LearningResourceJsonLd";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getResourceDownloadSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await getResourceDownload(slug);
  if (!resource) return { title: "Not Found" };

  const title = (resource.frontmatter.title as string) || "Resource";
  const description =
    (resource.frontmatter.subtitle as string) || "Verlin Labs learner resource";

  return createMetadata({
    title,
    description,
    path: `/resources/${slug}`,
  });
}

export default async function ResourceDownloadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await getResourceDownload(slug);
  if (!resource) notFound();

  const title = resource.frontmatter.title as string;
  const subtitle = resource.frontmatter.subtitle as string;
  const downloadLabel =
    (resource.frontmatter.downloadLabel as string) || "Print / Save as PDF";

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Resources", href: "/resources" },
    { label: title },
  ];

  return (
    <>
      <LearningResourceJsonLd name={title} description={subtitle} path={`/resources/${slug}`} />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath={`/resources/${slug}`} />
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        subtitle={subtitle}
        compact
        align="center"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <PrintButton label={downloadLabel} />
          <Link href="/resources">
            <Button variant="secondary" size="md" className="print:hidden">
              ← All resources
            </Button>
          </Link>
        </div>
      </PageHeader>
      <section className="pb-16 md:pb-24 print:pb-8">
        <div
          className="prose-verlin resource-prose mx-auto max-w-3xl px-4 md:px-8"
          dangerouslySetInnerHTML={{ __html: resource.html }}
        />
      </section>
    </>
  );
}