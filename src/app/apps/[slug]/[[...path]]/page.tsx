import { StandaloneAppRuntime } from "@/components/app-builder/StandaloneAppRuntime";
import { ensureTenantForProject } from "@/lib/app-builder/tenant-store";
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
  const c = project.content;
  return createMetadata({
    title: c.seoTitle || `${c.brandName} · ${c.city}`,
    description: c.seoDescription || c.description || c.tagline,
    path: project.publicPath,
  });
}

export default async function GeneratedAppPage({ params }: PageProps) {
  const { slug, path } = await params;
  const project = await getAppProjectBySlug(slug);

  if (!project || project.status !== "live" || !project.content) {
    notFound();
  }

  // Ensure tenant auth exists (owner = creator, default role = customer)
  try {
    await ensureTenantForProject(project);
  } catch (e) {
    console.error("[apps] ensureTenantForProject", e);
  }

  if (project.extensionId === "ecom-local-shop" && project.content.extensionId === "ecom-local-shop") {
    return (
      <StandaloneAppRuntime
        content={project.content}
        basePath={project.publicPath}
        slug={project.slug}
        pathSegments={path ?? []}
      />
    );
  }

  notFound();
}
