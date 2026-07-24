import { verifyApiKey } from "@/lib/api-key-auth";
import { publishToAccounts } from "@/lib/marketing/publisher";
import { recordMarketingPost } from "@/lib/marketing/posts-store";
import { claimDueScheduledPosts, completeScheduledPost } from "@/lib/marketing/scheduled-posts-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron (every 15 minutes, see vercel.json): publishes Marketing
 * Board posts whose scheduled time has arrived. Due entries are claimed
 * atomically first so a crashed run can't double-post, then each is
 * published through the same shared publisher the "post now" flow uses
 * and recorded in the marketing-posts ledger for the Performance view.
 * Auth: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const cronHeader = request.headers.get("authorization");
  const vercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!vercelCron && !verifyApiKey(request, "CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await claimDueScheduledPosts();
  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const scheduled of due) {
    try {
      const targets = await publishToAccounts(scheduled.accountIds, scheduled.content, scheduled.imageUrl, {
        imageUrls: scheduled.imageUrls,
        slides: scheduled.slides,
      });
      const post = await recordMarketingPost({
        content: scheduled.content,
        imageUrl: scheduled.imageUrl,
        targets,
        createdBy: `${scheduled.createdBy} (scheduled)`,
      });

      const anyPublished = targets.some((t) => t.status === "published");
      const failures = targets.filter((t) => t.status === "failed");
      await completeScheduledPost(scheduled.id, {
        status: anyPublished ? "published" : "failed",
        resultPostId: post.id,
        error:
          failures.length > 0
            ? failures.map((f) => `${f.platform}: ${f.error ?? "failed"}`).join("; ")
            : undefined,
      });
      results.push({ id: scheduled.id, status: anyPublished ? "published" : "failed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Publish failed";
      await completeScheduledPost(scheduled.id, { status: "failed", error: message });
      results.push({ id: scheduled.id, status: "failed", error: message });
    }
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}
