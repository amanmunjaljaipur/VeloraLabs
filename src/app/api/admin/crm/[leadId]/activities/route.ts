import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { addLeadActivity } from "@/lib/crm/store";
import type { CrmActivityType } from "@/lib/crm/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { leadId } = await params;
  let body: { type?: CrmActivityType; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Note body is required" }, { status: 400 });
  }

  const activity = addLeadActivity(leadId, {
    type: body.type ?? "note",
    body: body.body.trim(),
    createdBy: session.user.email ?? "admin",
  });

  if (!activity) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ activity }, { status: 201 });
}