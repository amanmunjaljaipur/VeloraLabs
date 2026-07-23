import { verifyApiKey } from "@/lib/api-key-auth";
import { ensureScheduledBlogQueue } from "@/lib/blog/auto-schedule";
import { publishDueBlogPosts } from "@/lib/blog/store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron - runs daily (see vercel.json).
 * 1. Publishes any scheduled blog posts whose time has come.
 * 2. Tops up the scheduled-post queue (auto-generates new posts, rotating
 *    through BLOG_SEQUENCES) so publishing never runs dry between cron ticks.
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
    return NextResponse.json({ success: false, ...paused, publishedCount: 0, generatedCount: 0 });
  }

  const published = await publishDueBlogPosts();
  const generated = await ensureScheduledBlogQueue();

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
    generatedCount: generated.length,
    generated: generated.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      scheduledAt: p.scheduledAt,
      sequenceId: p.sequenceId,
    })),
  });
}
