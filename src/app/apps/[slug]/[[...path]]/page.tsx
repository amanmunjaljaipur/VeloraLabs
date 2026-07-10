import { EcomLocalShopApp } from "@/components/app-builder/EcomLocalShopApp";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string; path?: string[] }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = await getAppProjectBySlug(slug);
  if (!project || project.status !== "live" || !project.content) {
    return { title: "App not found" };
  }
  return createMetadata({
    title: project.content.brandName,
    description: project.content.description || project.content.tagline,
    path: project.publicPath,
  });
}

export default async function GeneratedAppPage({ params }: PageProps) {
  const { slug, path } = await params;
  // Force Blob re-hydrate so navigation never hits an empty serverless seed
  const project = await getAppProjectBySlug(slug);

  if (!project || project.status !== "live" || !project.content) {
    notFound();
  }

  if (project.extensionId === "ecom-local-shop" && project.content.extensionId === "ecom-local-shop") {
    return (
      <EcomLocalShopApp
        content={project.content}
        basePath={project.publicPath}
        pathSegments={path ?? []}
      />
    );
  }

  notFound();
}
