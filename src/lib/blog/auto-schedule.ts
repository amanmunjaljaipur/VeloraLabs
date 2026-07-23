import { generateBlogPost } from "@/lib/blog/generate";
import { suggestNextSequenceId } from "@/lib/blog/sequences";
import { listBlogPosts, saveBlogPost } from "@/lib/blog/store";
import type { BlogPost } from "@/lib/blog/types";

/** Always keep at least this many future scheduled posts queued up. */
const MIN_QUEUE_DEPTH = 3;
/** Cadence between auto-generated posts. */
const INTERVAL_DAYS = 2;

/**
 * The three audience-specific tracks that must each get a fresh post on a
 * predictable cadence - plain round-robin over all 6 BLOG_SEQUENCES could
 * (and did) go a long stretch without touching one of these if the other,
 * audience-agnostic sequences (mental-models/llm-fundamentals/practice)
 * happened to come up more often in the rotation.
 */
const AUDIENCE_SEQUENCE_IDS = ["students", "engineers", "product"] as const;
/** How overdue an audience track must be before it jumps the queue. */
const AUDIENCE_MAX_GAP_DAYS = 4;

function mostRecentDateForSequence(posts: BlogPost[], sequenceId: string): number {
  let latest = 0;
  for (const p of posts) {
    if (p.sequenceId !== sequenceId) continue;
    const t = new Date(p.scheduledAt ?? p.publishedAt ?? p.createdAt).getTime();
    if (Number.isFinite(t) && t > latest) latest = t;
  }
  return latest;
}

/**
 * Picks the next sequence to generate for. Prioritizes any of the 3
 * audience-specific tracks (students/engineers/product) that hasn't had a
 * post in AUDIENCE_MAX_GAP_DAYS; otherwise falls back to the normal
 * round-robin across all 6 sequences (keeps mental-models/llm-fundamentals/
 * practice in the mix too).
 */
function pickNextSequenceId(allPosts: BlogPost[], lastSequenceId: string | null, asOf: Date): string {
  const nowMs = asOf.getTime();
  const overdue = AUDIENCE_SEQUENCE_IDS.map((id) => ({
    id,
    lastMs: mostRecentDateForSequence(allPosts, id),
  }))
    .filter((s) => nowMs - s.lastMs > AUDIENCE_MAX_GAP_DAYS * 24 * 60 * 60 * 1000)
    .sort((a, b) => a.lastMs - b.lastMs);

  if (overdue.length > 0) return overdue[0]!.id;
  return suggestNextSequenceId(lastSequenceId);
}

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
    const sequenceId = pickNextSequenceId(all, lastSequenceId, now);

    try {
      const draft = await generateBlogPost({
        sequenceId,
        scheduledAt: cursor.toISOString(),
        status: "scheduled",
        createdBy: "auto-scheduler",
      });
      const saved = await saveBlogPost(draft);
      created.push(saved);
      all.push(saved); // so the next iteration's overdue check sees it too
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
