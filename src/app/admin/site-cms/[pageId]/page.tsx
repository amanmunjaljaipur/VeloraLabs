import { SiteCmsEditor } from "@/components/admin/SiteCmsEditor";
import { getCmsPage } from "@/lib/cms/registry";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ pageId: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { pageId } = await params;
  const page = getCmsPage(pageId);
  if (!page) return {};

  return createMetadata({
    title: `Edit ${page.label}`,
    description: page.description,
    path: `/admin/site-cms/${pageId}`,
  });
}

export default async function SiteCmsEditorPage({ params }: PageProps) {
  const { pageId } = await params;
  if (!getCmsPage(pageId)) notFound();
  return <SiteCmsEditor pageId={pageId} />;
}