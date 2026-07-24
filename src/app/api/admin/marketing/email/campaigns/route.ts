import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { cancelCampaign, completeCampaign, createCampaign, listCampaigns } from "@/lib/marketing/campaigns-store";
import { sendCampaignNow } from "@/lib/marketing/campaign-sender";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const campaigns = await listCampaigns();
  return NextResponse.json({ campaigns });
}

/**
 * Body: { subject, html, recipients: string[], includeAllLeads?, scheduledAt?: ISO }
 * With scheduledAt in the future, queues the campaign for the cron; otherwise sends immediately.
 */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const html = typeof body?.html === "string" ? body.html : "";
  const recipients = Array.isArray(body?.recipients)
    ? body.recipients.filter((e: unknown): e is string => typeof e === "string" && e.includes("@"))
    : [];
  const includeAllLeads = Boolean(body?.includeAllLeads);
  const scheduledAtRaw = typeof body?.scheduledAt === "string" ? body.scheduledAt : "";

  if (!subject || !html) {
    return NextResponse.json({ error: "subject and html are required" }, { status: 400 });
  }
  if (recipients.length === 0 && !includeAllLeads) {
    return NextResponse.json({ error: "Add at least one recipient or include all leads" }, { status: 400 });
  }

  let scheduledAt: string | null = null;
  if (scheduledAtRaw) {
    const parsed = new Date(scheduledAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid schedule time" }, { status: 400 });
    }
    if (parsed.getTime() <= Date.now() + 60_000) {
      return NextResponse.json({ error: "Schedule time must be at least a minute in the future" }, { status: 400 });
    }
    scheduledAt = parsed.toISOString();
  }

  const campaign = await createCampaign({
    subject,
    html,
    recipients,
    includeAllLeads,
    scheduledAt,
    createdBy: session.user?.email ?? "unknown",
  });

  if (scheduledAt) {
    return NextResponse.json({ campaign, scheduled: true }, { status: 201 });
  }

  const result = await sendCampaignNow(campaign);
  await completeCampaign(campaign.id, {
    status: result.sentCount > 0 ? "sent" : "failed",
    sentCount: result.sentCount,
    failedCount: result.failedCount,
  });

  return NextResponse.json({ campaign: { ...campaign, ...result }, result }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const ok = await cancelCampaign(id);
  return NextResponse.json({ canceled: ok });
}
