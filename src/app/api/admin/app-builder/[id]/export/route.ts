import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { packageAppProject, readPackagedFiles } from "@/lib/app-builder/packager";
import { getAppProject } from "@/lib/app-builder/store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Returns all files for the app's hosting folder as JSON
 * (project.json + site/index.html + README).
 */
export async function GET(_req: NextRequest, context: Ctx) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const project = await getAppProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.content || project.status !== "live") {
    return NextResponse.json(
      { error: "Publish the shop first, then download the folder." },
      { status: 400 }
    );
  }

  let files = readPackagedFiles(project.slug);
  if (!files || !files["site/index.html"]) {
    await packageAppProject(project);
    files = readPackagedFiles(project.slug);
  }

  if (!files || !files["site/index.html"]) {
    return NextResponse.json({ error: "Could not build hosting folder" }, { status: 500 });
  }

  return NextResponse.json({
    slug: project.slug,
    folder: `generated-apps/${project.slug}`,
    files,
    howToHost:
      "Upload everything inside the site/ folder to any static host (Netlify Drop, Hostinger, etc.), or open site/index.html on your computer.",
  });
}
