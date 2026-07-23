import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import type { MarketingPlatform } from "@/lib/marketing/accounts-store";

/**
 * Our own ledger of what has been published through the Marketing Board.
 * With no vendor in between, nothing else in the world remembers "we
 * posted X to Facebook Page Y and LinkedIn got post ID Z" - so this file
 * is the single source of truth the performance view reads from to know
 * which platform post IDs to pull analytics for.
 */

const POSTS_FILE = "marketing-posts.json";
const DEFAULT_JSON = "[]";

export interface PostTarget {
  accountId: string;
  platform: MarketingPlatform;
  status: "published" | "failed";
  platformPostId: string | null;
  error?: string;
}

export interface MarketingPost {
  id: string;
  content: string;
  imageUrl: string | null;
  targets: PostTarget[];
  createdBy: string;
  createdAt: string;
}

async function readAll(): Promise<MarketingPost[]> {
  await ensureDataFileHydrated(POSTS_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<MarketingPost[]>(POSTS_FILE, DEFAULT_JSON);
}

async function writeAll(items: MarketingPost[]): Promise<void> {
  await writeJsonFileAsync(POSTS_FILE, items, DEFAULT_JSON);
}

export async function listMarketingPosts(): Promise<MarketingPost[]> {
  const all = await readAll();
  return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function recordMarketingPost(input: {
  content: string;
  imageUrl: string | null;
  targets: PostTarget[];
  createdBy: string;
}): Promise<MarketingPost> {
  const all = await readAll();
  const record: MarketingPost = {
    id: randomUUID(),
    content: input.content,
    imageUrl: input.imageUrl,
    targets: input.targets,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  all.push(record);
  await writeAll(all);
  return record;
}
