import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { DEFAULT_TENANT_ID } from "@/lib/marketing/tenants-store";

/**
 * Queue of posts scheduled for later publishing. The marketing cron picks
 * up due entries, publishes them through the shared publisher, records the
 * result in the marketing-posts ledger, and marks the queue entry done -
 * so scheduled posts show up in Performance exactly like immediate ones.
 */

const SCHEDULED_FILE = "marketing-scheduled-posts.json";
const DEFAULT_JSON = "[]";

export interface ScheduledSlide {
  heading: string;
  body?: string;
}

export interface ScheduledPost {
  id: string;
  tenantId: string;
  content: string;
  imageUrl: string | null;
  imageUrls?: string[];
  slides?: ScheduledSlide[];
  accountIds: string[];
  /** ISO timestamp the post becomes due */
  scheduledAt: string;
  status: "scheduled" | "published" | "failed";
  /** id of the marketing-posts ledger entry once published */
  resultPostId?: string | null;
  error?: string;
  createdBy: string;
  createdAt: string;
}

async function readAll(): Promise<ScheduledPost[]> {
  await ensureDataFileHydrated(SCHEDULED_FILE, DEFAULT_JSON, { force: true });
  const all = readJsonFile<ScheduledPost[]>(SCHEDULED_FILE, DEFAULT_JSON);
  return all.map((p) => (p.tenantId ? p : { ...p, tenantId: DEFAULT_TENANT_ID }));
}

async function writeAll(items: ScheduledPost[]): Promise<void> {
  await writeJsonFileAsync(SCHEDULED_FILE, items, DEFAULT_JSON);
}

export async function listScheduledPosts(tenantId: string): Promise<ScheduledPost[]> {
  const all = await readAll();
  return all.filter((p) => p.tenantId === tenantId).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export async function createScheduledPost(input: {
  tenantId: string;
  content: string;
  imageUrl: string | null;
  imageUrls?: string[];
  slides?: ScheduledSlide[];
  accountIds: string[];
  scheduledAt: string;
  createdBy: string;
}): Promise<ScheduledPost> {
  const all = await readAll();
  const record: ScheduledPost = {
    id: randomUUID(),
    tenantId: input.tenantId,
    content: input.content,
    imageUrl: input.imageUrl,
    imageUrls: input.imageUrls?.length ? input.imageUrls : undefined,
    slides: input.slides?.length ? input.slides : undefined,
    accountIds: input.accountIds,
    scheduledAt: input.scheduledAt,
    status: "scheduled",
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  all.push(record);
  await writeAll(all);
  return record;
}

export async function cancelScheduledPost(id: string, tenantId: string): Promise<boolean> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === id && p.tenantId === tenantId && p.status === "scheduled");
  if (idx === -1) return false;
  all.splice(idx, 1);
  await writeAll(all);
  return true;
}

/** Atomically claim due posts by flipping them out of "scheduled" before publishing. */
export async function claimDueScheduledPosts(now = new Date()): Promise<ScheduledPost[]> {
  const all = await readAll();
  const nowIso = now.toISOString();
  const due = all.filter((p) => p.status === "scheduled" && p.scheduledAt <= nowIso);
  if (due.length === 0) return [];

  // Mark as failed-in-progress first so a crashed cron can't double-post on
  // the next tick; completeScheduledPost() upgrades the status afterwards.
  for (const post of all) {
    if (post.status === "scheduled" && post.scheduledAt <= nowIso) {
      post.status = "failed";
      post.error = "Publishing interrupted - check the posts ledger before retrying";
    }
  }
  await writeAll(all);
  return due;
}

export async function completeScheduledPost(
  id: string,
  outcome: { status: "published" | "failed"; resultPostId?: string | null; error?: string }
): Promise<void> {
  const all = await readAll();
  const post = all.find((p) => p.id === id);
  if (!post) return;
  post.status = outcome.status;
  post.resultPostId = outcome.resultPostId ?? null;
  post.error = outcome.error;
  await writeAll(all);
}
