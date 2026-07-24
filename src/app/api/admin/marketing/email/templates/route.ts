import { requireCmsEditor } from "@/lib/cms/admin-auth";
import {
  createEmailTemplate,
  deleteEmailTemplate,
  listEmailTemplates,
} from "@/lib/marketing/email-templates-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const templates = await listEmailTemplates(tenantId);
  return NextResponse.json({ templates });
}

/** Save a template - either hand-written or the result of /templates/generate. */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const html = typeof body?.html === "string" ? body.html : "";
  if (!name || !subject || !html) {
    return NextResponse.json({ error: "name, subject, and html are required" }, { status: 400 });
  }

  const tenantId = await resolveTenantId(session.user?.email);
  const template = await createEmailTemplate({
    tenantId,
    name,
    subject,
    html,
    imageUrl: typeof body?.imageUrl === "string" ? body.imageUrl : null,
    generatedByAi: Boolean(body?.generatedByAi),
    createdBy: session.user?.email ?? "unknown",
  });
  return NextResponse.json({ template }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const tenantId = await resolveTenantId(session.user?.email);
  const ok = await deleteEmailTemplate(id, tenantId);
  return NextResponse.json({ deleted: ok });
}
