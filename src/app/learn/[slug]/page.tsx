import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { SemanticHubPage } from "@/components/sections/SemanticHubPage";
import { FaqPageJsonLd } from "@/components/seo/FaqPageJsonLd";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import { PAGE_SEO } from "@/lib/page-metadata";
import { getSemanticHub, getAllSemanticHubSlugs } from "@/lib/semantic-hubs";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getAllSemanticHubSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hub = getSemanticHub(slug);
  if (!hub) return { title: "Not Found" };
  const seo = PAGE_SEO[hub.seoKey];
  return createMetadata({
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    path: hub.path,
  });
}

export default async function LearnHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hub = getSemanticHub(slug);
  if (!hub) notFound();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Learn", href: "/blog" },
    { label: hub.eyebrow },
  ];

  return (
    <>
      <FaqPageJsonLd items={hub.faqs} path={hub.path} />
      <HowToJsonLd
        name={hub.headline}
        description={hub.subheadline}
        path={hub.path}
        steps={hub.sections.map((s) => ({
          name: s.title,
          text: s.paragraphs.join(" "),
        }))}
      />
      <PersonJsonLd />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath={hub.path} />
      <SemanticHubPage hub={hub} breadcrumbs={breadcrumbs} />
    </>
  );
}