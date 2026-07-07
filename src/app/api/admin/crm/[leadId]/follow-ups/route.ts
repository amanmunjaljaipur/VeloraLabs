import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { addFollowUp, updateFollowUpStatus } from "@/lib/crm/store";
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
  let body: { dueAt?: string; reason?: string; status?: "pending" | "done" | "cancelled"; followUpId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.followUpId && body.status) {
    const followUp = updateFollowUpStatus(body.followUpId, body.status, session.user.email ?? "admin");
    if (!followUp) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    }
    return NextResponse.json({ followUp });
  }

  if (!body.dueAt || !body.reason?.trim()) {
    return NextResponse.json({ error: "dueAt and reason are required" }, { status: 400 });
  }

  const followUp = addFollowUp(leadId, {
    dueAt: body.dueAt,
    reason: body.reason.trim(),
    createdBy: session.user.email ?? "admin",
  });

  if (!followUp) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ followUp }, { status: 201 });
}