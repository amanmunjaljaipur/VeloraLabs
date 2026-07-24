import { verifyApiKey } from "@/lib/api-key-auth";
import { claimDueCampaigns, completeCampaign } from "@/lib/marketing/campaigns-store";
import { sendCampaignNow } from "@/lib/marketing/campaign-sender";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron (every 15 minutes, see vercel.json): sends Email Suite
 * campaigns whose scheduled time has arrived. Mirrors /api/cron/marketing's
 * claim-then-send pattern so a crashed run can't double-send.
 * Auth: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const cronHeader = request.headers.get("authorization");
  const vercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!vercelCron && !verifyApiKey(request, "CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await claimDueCampaigns();
  const results: Array<{ id: string; sentCount: number; failedCount: number }> = [];

  for (const campaign of due) {
    try {
      const result = await sendCampaignNow(campaign);
      await completeCampaign(campaign.id, {
        status: result.sentCount > 0 ? "sent" : "failed",
        sentCount: result.sentCount,
        failedCount: result.failedCount,
      });
      results.push({ id: campaign.id, sentCount: result.sentCount, failedCount: result.failedCount });
    } catch (error) {
      console.error(`Campaign ${campaign.id} failed:`, error);
      await completeCampaign(campaign.id, { status: "failed", sentCount: 0, failedCount: campaign.recipients.length });
      results.push({ id: campaign.id, sentCount: 0, failedCount: campaign.recipients.length });
    }
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}
