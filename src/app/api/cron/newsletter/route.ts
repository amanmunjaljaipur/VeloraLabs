import { verifyApiKey } from "@/lib/api-key-auth";
import { publishWeeklyNewsletterViaMcp } from "@/lib/newsletter-publish-weekly";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Vercel Cron — weekly newsletter (generate from web + publish + email).
 * Schedule: Sunday 03:30 UTC (~09:00 IST).
 *
 * Idempotent: if this IST week already has an edition, returns success without
 * creating a duplicate.
 */
export async function GET(request: NextRequest) {
  const cronHeader = request.headers.get("authorization");
  const vercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!vercelCron && !verifyApiKey(request, "CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await publishWeeklyNewsletterViaMcp();

    return NextResponse.json({
      success: true,
      message: result.alreadyPublished
        ? "Newsletter already published for this week"
        : "Weekly newsletter generated, published, and emailed",
      alreadyPublished: result.alreadyPublished,
      generated: result.generated,
      edition: result.edition,
      email: {
        configured: result.email.configured,
        subscriberCount: result.email.subscriberCount,
        sentCount: result.email.sentCount,
        failedCount: result.email.failedCount,
      },
    });
  } catch (error) {
    console.error("[cron/newsletter] failed:", error);
    const message = error instanceof Error ? error.message : "Publish failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
