import { requireAppCapability } from "@/lib/app-builder/app-auth";
import { getAppProjectBySlug } from "@/lib/app-builder/store";
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from "@/lib/app-builder/tenant-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

/** Confirm modelId is a real data model on this project (prevents writing to arbitrary keys). */
async function validModelId(slug: string, modelId: string): Promise<boolean> {
  const project = await getAppProjectBySlug(slug);
  return Boolean(project?.dataModels?.some((m) => m.id === modelId));
}

export async function GET(req: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "data.view")) ||
    (await requireAppCapability(slug, "data.manage")) ||
    (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const modelId = searchParams.get("modelId");
  if (!modelId) return NextResponse.json({ error: "modelId is required" }, { status: 400 });
  if (!(await validModelId(slug, modelId))) {
    return NextResponse.json({ error: "Unknown data model" }, { status: 404 });
  }

  const records = await listRecords(slug, modelId);
  return NextResponse.json({ records });
}

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "data.manage")) || (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { modelId?: string; fields?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.modelId || !body.fields || typeof body.fields !== "object") {
    return NextResponse.json({ error: "modelId and fields are required" }, { status: 400 });
  }
  if (!(await validModelId(slug, body.modelId))) {
    return NextResponse.json({ error: "Unknown data model" }, { status: 404 });
  }

  const record = await createRecord(slug, body.modelId, body.fields, authz.session.email);
  return NextResponse.json({ record }, { status: 201 });
}

export async function PATCH(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "data.manage")) || (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { modelId?: string; recordId?: string; fields?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.modelId || !body.recordId || !body.fields || typeof body.fields !== "object") {
    return NextResponse.json(
      { error: "modelId, recordId and fields are required" },
      { status: 400 }
    );
  }
  if (!(await validModelId(slug, body.modelId))) {
    return NextResponse.json({ error: "Unknown data model" }, { status: 404 });
  }

  const record = await updateRecord(slug, body.modelId, body.recordId, body.fields);
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });
  return NextResponse.json({ record });
}

export async function DELETE(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const authz =
    (await requireAppCapability(slug, "data.manage")) || (await requireAppCapability(slug, "*"));
  if (!authz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { modelId?: string; recordId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.modelId || !body.recordId) {
    return NextResponse.json({ error: "modelId and recordId are required" }, { status: 400 });
  }

  const ok = await deleteRecord(slug, body.modelId, body.recordId);
  if (!ok) return NextResponse.json({ error: "Record not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
