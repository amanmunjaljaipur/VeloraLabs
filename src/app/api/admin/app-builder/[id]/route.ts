import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { deleteAppProject, getAppProject, saveAppProject } from "@/lib/app-builder/store";
import type { AppProjectStatus } from "@/lib/app-builder/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const project = getAppProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(req: NextRequest, context: Ctx) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const existing = getAppProject(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { status?: AppProjectStatus; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const next = {
    ...existing,
    updatedAt: new Date().toISOString(),
  };
  if (body.status) next.status = body.status;
  if (body.name?.trim()) next.name = body.name.trim();

  if (body.status === "live" && !existing.content) {
    return NextResponse.json({ error: "Generate content before going live" }, { status: 400 });
  }

  saveAppProject(next);
  return NextResponse.json({ project: next });
}

export async function DELETE(_req: NextRequest, context: Ctx) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  if (!deleteAppProject(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
