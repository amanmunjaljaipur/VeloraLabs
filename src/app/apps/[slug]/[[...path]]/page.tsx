import { StandaloneAppRuntime } from "@/components/app-builder/StandaloneAppRuntime";
import { VerlinAppRuntime } from "@/components/app-builder/VerlinAppRuntime";
import { StudioWorkingApp } from "@/components/app-studio/StudioWorkingApp";
import { isGenericContent } from "@/lib/app-builder/types";
import { ensureTenantForProject } from "@/lib/app-builder/tenant-store";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import {
  resolveInteractiveAppSpec,
  shouldUseInteractiveRuntime,
} from "@/lib/app-studio/resolve-interactive";
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
  if (!project || project.status !== "live") {
    return { title: "App not found" };
  }
  if (project.studioAppSpec) {
    return createMetadata({
      title: `${project.studioAppSpec.brandName} · Live app`,
      description: project.studioAppSpec.description,
      path: project.publicPath,
    });
  }
  if (!project.content) {
    return createMetadata({
      title: `${project.name} · Live app`,
      description: project.prompt?.slice(0, 160) || project.name,
      path: project.publicPath,
    });
  }
  const c = project.content;
  return createMetadata({
    title: c.seoTitle || `${c.brandName}`,
    description: c.seoDescription || c.description || c.tagline,
    path: project.publicPath,
  });
}

export default async function GeneratedAppPage({ params }: PageProps) {
  const { slug, path } = await params;
  const project = await getAppProjectBySlug(slug);

  if (!project || project.status !== "live") {
    notFound();
  }

  try {
    await ensureTenantForProject(project);
  } catch (e) {
    console.error("[apps] ensureTenantForProject", e);
  }

  // Non-shop apps: always interactive multi-role product (auto-upgrades old marketing shells
  // e.g. ResumeLift, Verlin Bank from App Builder / App Studio)
  if (shouldUseInteractiveRuntime(project)) {
    try {
      const { spec } = await resolveInteractiveAppSpec(project);
      return (
        <div className="flex h-full min-h-0 flex-col bg-background">
          <StudioWorkingApp
            key={`${project.slug}-${spec.brandName}`}
            spec={spec}
            fullScreen
            className="h-full min-h-0"
          />
        </div>
      );
    } catch (e) {
      console.error("[apps] interactive upgrade failed", e);
      // fall through to content runtime only as last resort
    }
  }

  if (project.content) {
    if (project.runtimeStyle === "verlin-native" && isGenericContent(project.content)) {
      return (
        <VerlinAppRuntime
          content={project.content}
          slug={project.slug}
          dataModels={project.dataModels}
          pathSegments={path ?? []}
        />
      );
    }
    return (
      <StandaloneAppRuntime
        content={project.content}
        basePath={project.publicPath}
        slug={project.slug}
        pathSegments={path ?? []}
        dataModels={project.dataModels}
      />
    );
  }

  notFound();
}
