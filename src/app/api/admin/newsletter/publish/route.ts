import { auth } from "@/auth";
import { publishWeeklyNewsletterViaMcp } from "@/lib/newsletter-publish-weekly";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Super-admin: generate (if needed) + publish this week's edition + email.
 * Same pipeline as the Sunday cron job.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await publishWeeklyNewsletterViaMcp();

    return NextResponse.json({
      success: true,
      alreadyPublished: result.alreadyPublished,
      generated: result.generated,
      edition: result.edition,
      email: result.email,
    });
  } catch (error) {
    console.error("[admin/newsletter/publish] failed:", error);
    const message = error instanceof Error ? error.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
