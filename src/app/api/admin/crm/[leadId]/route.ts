import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { deleteLead, getLeadDetail, updateLead } from "@/lib/crm/store";
import type { CrmLeadInput, CrmStage } from "@/lib/crm/types";
import { CRM_SOURCES, CRM_STAGES } from "@/lib/crm/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { leadId } = await params;
  const detail = getLeadDetail(leadId);
  if (!detail) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { leadId } = await params;
  let body: Partial<CrmLeadInput> & { stage?: CrmStage };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.stage && !CRM_STAGES.includes(body.stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  if (body.source && !CRM_SOURCES.includes(body.source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const lead = updateLead(leadId, body, session.user.email ?? "admin");
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ lead, detail: getLeadDetail(leadId) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { leadId } = await params;
  const ok = deleteLead(leadId, session.user.email ?? "admin");
  if (!ok) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}