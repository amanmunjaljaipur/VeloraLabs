import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { createLead, readCrmStore } from "@/lib/crm/store";
import { loadCrmDashboard } from "@/lib/crm/service";
import { syncCrmFromSources } from "@/lib/crm/sync";
import type { CrmLeadInput, CrmSource, CrmStage } from "@/lib/crm/types";
import { CRM_SOURCES, CRM_STAGES } from "@/lib/crm/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await loadCrmDashboard();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: CrmLeadInput & { action?: "sync" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.action === "sync") {
    const result = await syncCrmFromSources();
    const data = await loadCrmDashboard();
    return NextResponse.json({ ...data, sync: result });
  }

  if (!body.email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (body.stage && !CRM_STAGES.includes(body.stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  if (body.source && !CRM_SOURCES.includes(body.source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const lead = createLead(body, session.user.email ?? "admin");
  return NextResponse.json({ lead, store: readCrmStore() }, { status: 201 });
}