import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { deleteLead, listLeads, updateLeadStatus, upsertLead, type LeadStatus } from "@/lib/marketing/leads-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "customer", "lost"];

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const leads = await listLeads(tenantId);
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const tenantId = await resolveTenantId(session.user?.email);
  const lead = await upsertLead({
    tenantId,
    email,
    name: typeof body?.name === "string" ? body.name : null,
    company: typeof body?.company === "string" ? body.company : null,
    source: "manual",
    notes: typeof body?.notes === "string" ? body.notes : null,
  });
  return NextResponse.json({ lead }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? body.status : "";
  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status as LeadStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const tenantId = await resolveTenantId(session.user?.email);
  const lead = await updateLeadStatus(id, tenantId, status as LeadStatus);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function DELETE(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const tenantId = await resolveTenantId(session.user?.email);
  const ok = await deleteLead(id, tenantId);
  return NextResponse.json({ deleted: ok });
}
