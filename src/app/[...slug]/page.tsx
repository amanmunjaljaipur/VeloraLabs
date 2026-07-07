import { PageHeader } from "@/components/layout/PageHeader";
import { getCustomCmsPageByPath } from "@/lib/cms/dynamic-pages";
import { readRichPageContent } from "@/lib/cms/rich-content";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function CustomCmsPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  const page = getCustomCmsPageByPath(path);
  if (!page || page.type !== "rich") {
    notFound();
  }

  const content = readRichPageContent(page.filename);

  return (
    <>
      <PageHeader title={content.title || page.label} subtitle={content.subtitle} />
      <section className="container-verlin py-10 md:py-14">
        <article
          className="cms-rich-prose mx-auto max-w-3xl"
          dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
        />
      </section>
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  const page = getCustomCmsPageByPath(path);
  if (!page) return {};

  const content = readRichPageContent(page.filename);
  return createMetadata({
    title: content.title || page.label,
    description: content.seoDescription || page.description,
    path,
  });
}