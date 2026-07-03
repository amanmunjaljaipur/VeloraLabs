import { verifyApiKey } from "@/lib/api-key-auth";
import { publishWeeklyNewsletter } from "@/lib/news-updates";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Vercel Cron — publishes the weekly newsletter every Sunday. */
export async function GET(request: NextRequest) {
  const cronHeader = request.headers.get("authorization");
  const vercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!vercelCron && !verifyApiKey(request, "CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const edition = await publishWeeklyNewsletter();
    return NextResponse.json({
      success: true,
      message: "Weekly newsletter published",
      edition: {
        slug: edition.slug,
        title: edition.title,
        itemCount: edition.itemCount,
        publicUrl: `/newsletter/weekly?edition=${edition.slug}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }
}