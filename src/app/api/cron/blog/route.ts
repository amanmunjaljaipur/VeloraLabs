import { verifyApiKey } from "@/lib/api-key-auth";
import { publishDueBlogPosts } from "@/lib/blog/store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Vercel Cron - publishes due scheduled blog posts (runs hourly).
 * Auth: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const cronHeader = request.headers.get("authorization");
  const vercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!vercelCron && !verifyApiKey(request, "CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assertAgentActive } = await import("@/lib/agents/controls");
  const paused = await assertAgentActive("cron-blog");
  if (paused) {
    return NextResponse.json({ success: false, ...paused, publishedCount: 0 });
  }

  const published = publishDueBlogPosts();
  return NextResponse.json({
    success: true,
    publishedCount: published.length,
    posts: published.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      publishedAt: p.publishedAt,
      sequenceId: p.sequenceId,
    })),
  });
}
