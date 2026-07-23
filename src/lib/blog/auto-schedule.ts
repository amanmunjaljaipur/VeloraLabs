import { generateBlogPost } from "@/lib/blog/generate";
import { suggestNextSequenceId } from "@/lib/blog/sequences";
import { listBlogPosts, saveBlogPost } from "@/lib/blog/store";
import type { BlogPost } from "@/lib/blog/types";

/** Always keep at least this many future scheduled posts queued up. */
const MIN_QUEUE_DEPTH = 3;
/** Cadence between auto-generated posts. */
const INTERVAL_DAYS = 2;

/**
 * Keeps the scheduled-post pipeline topped up so publishing never goes dry.
 * `generateBlogPost` (AI-or-template article writing) and `/api/cron/blog`
 * (publish-when-due) already existed independently - this is the missing
 * link that actually creates new posts on a schedule, rotating through
 * BLOG_SEQUENCES so the mix of topics stays varied.
 *
 * Idempotent-ish by design: it only tops up the queue to MIN_QUEUE_DEPTH, so
 * repeated cron runs before the queue drains again are no-ops.
 */
export async function ensureScheduledBlogQueue(now = new Date()): Promise<BlogPost[]> {
  const all = await listBlogPosts();

  const futureScheduled = all
    .filter((p) => p.status === "scheduled" && p.scheduledAt && p.scheduledAt > now.toISOString())
    .sort((a, b) => (a.scheduledAt! < b.scheduledAt! ? -1 : 1));

  const needed = MIN_QUEUE_DEPTH - futureScheduled.length;
  if (needed <= 0) return [];

  let cursor =
    futureScheduled.length > 0
      ? new Date(futureScheduled[futureScheduled.length - 1]!.scheduledAt!)
      : now;

  let lastSequenceId: string | null =
    futureScheduled[futureScheduled.length - 1]?.sequenceId ?? all[0]?.sequenceId ?? null;

  const created: BlogPost[] = [];

  for (let i = 0; i < needed; i++) {
    cursor = new Date(cursor.getTime() + INTERVAL_DAYS * 24 * 60 * 60 * 1000);
    const sequenceId = suggestNextSequenceId(lastSequenceId);

    try {
      const draft = await generateBlogPost({
        sequenceId,
        scheduledAt: cursor.toISOString(),
        status: "scheduled",
        createdBy: "auto-scheduler",
      });
      const saved = await saveBlogPost(draft);
      created.push(saved);
      lastSequenceId = sequenceId;
    } catch (error) {
      console.error("[blog/auto-schedule] failed to generate post:", error);
      // Stop this run rather than looping on a persistent failure - next
      // cron invocation will retry.
      break;
    }
  }

  return created;
}
