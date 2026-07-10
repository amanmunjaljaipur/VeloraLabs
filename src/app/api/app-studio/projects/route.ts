import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { listAppProjects } from "@/lib/app-builder/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** List App Studio / hosted apps for the current admin. */
export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const all = await listAppProjects();
  const projects = all
    .filter(
      (p) =>
        p.generatedBy === "app-studio" ||
        p.customPoints?.some((c) => /App Studio/i.test(c)) ||
        p.runtimeStyle === "verlin-native"
    )
    .slice(0, 40)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      status: p.status,
      publicPath: p.publicPath,
      prompt: p.prompt?.slice(0, 160),
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    }));

  return NextResponse.json({ projects });
}
