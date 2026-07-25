import { del, list } from "@vercel/blob";
import {
  BLOB_PREFIX,
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFile,
} from "@/lib/data-store";

/**
 * Durable, deployment-proof log of *critical* events only (failures, not
 * routine activity) - the thing this session was missing while debugging the
 * Instagram OAuth issue, where a temporary code change + redeploy was the
 * only way to see what Meta's API actually returned.
 *
 * Stored as one JSON shard per calendar month (`diagnostics-log-YYYY-MM.json`)
 * in the same Vercel Blob store every other runtime store uses, so it
 * survives redeploys exactly like user-roles.json / marketing-accounts.json
 * do. Retained for ~3 months; older shards are pruned opportunistically by
 * the daily cron (see /api/cron/prune-logs).
 *
 * Deliberately NOT a place to log everything - call logError/logWarn only at
 * genuine failure points (OAuth connect failures, send failures, cron job
 * failures, payment/booking errors), not on every request or success.
 */

export type LogLevel = "error" | "warn";

export interface LogEntry {
  id: string;
  timestamp: string; // ISO 8601
  level: LogLevel;
  /** Which part of the product this came from, e.g. "marketing/instagram-connect", "email/send", "cron/growth-advisor". Used for the super-admin page-wise log viewer. */
  page: string;
  message: string;
  meta?: Record<string, unknown>;
  tenantId?: string | null;
}

const RETENTION_MONTHS = 3;
const MAX_ENTRIES_PER_SHARD = 2000;
const SHARD_PREFIX = "diagnostics-log-";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function shardFilename(date: Date): string {
  return `${SHARD_PREFIX}${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}.json`;
}

/** First-of-month UTC dates for "this month" back through N months ago, inclusive, newest first. */
function monthsBack(n: number): Date[] {
  const now = new Date();
  const out: Date[] = [];
  for (let i = 0; i <= n; i++) {
    out.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)));
  }
  return out;
}

function randomId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readShard(filename: string): Promise<LogEntry[]> {
  try {
    // Always force-hydrate from Blob - logs are read infrequently (admin
    // viewer, cron prune) so there's no hot-path cost to always being fresh.
    await ensureDataFileHydrated(filename, "[]", { force: true });
    return readJsonFile<LogEntry[]>(filename, "[]");
  } catch {
    return [];
  }
}

function writeShard(filename: string, entries: LogEntry[]): void {
  // Fire-and-forget Blob persist (writeJsonFile, not the *Async variant) -
  // logging must never slow down or fail the request that triggered it.
  writeJsonFile(filename, entries, "[]");
}

/**
 * Record a critical event durably. Never throws - a logging failure must
 * never take down the request that's already failing for its own reason.
 */
export async function logEvent(input: {
  level: LogLevel;
  page: string;
  message: string;
  meta?: Record<string, unknown>;
  tenantId?: string | null;
}): Promise<void> {
  const line = `[${input.level.toUpperCase()}] [${input.page}] ${input.message}`;
  if (input.level === "error") console.error(line, input.meta ?? "");
  else console.warn(line, input.meta ?? "");

  try {
    const now = new Date();
    const filename = shardFilename(now);
    const entries = await readShard(filename);
    entries.push({
      id: randomId(),
      timestamp: now.toISOString(),
      level: input.level,
      page: input.page,
      message: input.message,
      meta: input.meta,
      tenantId: input.tenantId ?? null,
    });
    const trimmed =
      entries.length > MAX_ENTRIES_PER_SHARD
        ? entries.slice(entries.length - MAX_ENTRIES_PER_SHARD)
        : entries;
    writeShard(filename, trimmed);
  } catch (e) {
    console.error("[diagnostics] failed to persist log entry", e);
  }
}

export function logError(
  page: string,
  message: string,
  meta?: Record<string, unknown>,
  tenantId?: string | null
): Promise<void> {
  return logEvent({ level: "error", page, message, meta, tenantId });
}

export function logWarn(
  page: string,
  message: string,
  meta?: Record<string, unknown>,
  tenantId?: string | null
): Promise<void> {
  return logEvent({ level: "warn", page, message, meta, tenantId });
}

function retainedShardFilenames(): string[] {
  return monthsBack(RETENTION_MONTHS).map(shardFilename);
}

export interface LogQuery {
  page?: string;
  level?: LogLevel;
  since?: string; // ISO
  limit?: number;
}

/** Read + merge + filter across retained shards, newest first. */
export async function listLogs(query: LogQuery = {}): Promise<LogEntry[]> {
  const shards = retainedShardFilenames();
  const all: LogEntry[] = [];
  for (const filename of shards) {
    all.push(...(await readShard(filename)));
  }

  let filtered = all;
  if (query.page) filtered = filtered.filter((e) => e.page === query.page);
  if (query.level) filtered = filtered.filter((e) => e.level === query.level);
  if (query.since) filtered = filtered.filter((e) => e.timestamp >= query.since!);

  filtered.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return query.limit ? filtered.slice(0, query.limit) : filtered;
}

/** Distinct pages seen in the retained window, with counts - powers the super-admin page picker. */
export async function listLogPages(): Promise<
  { page: string; count: number; errorCount: number; lastAt: string }[]
> {
  const shards = retainedShardFilenames();
  const byPage = new Map<string, { count: number; errorCount: number; lastAt: string }>();
  for (const filename of shards) {
    const entries = await readShard(filename);
    for (const e of entries) {
      const existing = byPage.get(e.page);
      if (existing) {
        existing.count += 1;
        if (e.level === "error") existing.errorCount += 1;
        if (e.timestamp > existing.lastAt) existing.lastAt = e.timestamp;
      } else {
        byPage.set(e.page, {
          count: 1,
          errorCount: e.level === "error" ? 1 : 0,
          lastAt: e.timestamp,
        });
      }
    }
  }
  return Array.from(byPage.entries())
    .map(([page, v]) => ({ page, ...v }))
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}

/**
 * Delete Blob shards older than the retention window. Best-effort, safe to
 * call repeatedly (e.g. once a day from a cron) - never touches shards
 * inside the retention window, so "at least 3 months" is never violated.
 */
export async function pruneOldLogs(): Promise<{ deleted: string[] }> {
  const deleted: string[] = [];
  const keepFrom = monthsBack(RETENTION_MONTHS)[RETENTION_MONTHS]; // oldest month still kept

  try {
    let cursor: string | undefined;
    do {
      const result = await list({ prefix: `${BLOB_PREFIX}${SHARD_PREFIX}`, cursor, limit: 1000 });
      for (const blob of result.blobs) {
        const filename = blob.pathname.startsWith(BLOB_PREFIX)
          ? blob.pathname.slice(BLOB_PREFIX.length)
          : blob.pathname;
        const match = /^diagnostics-log-(\d{4})-(\d{2})\.json$/.exec(filename);
        if (!match) continue;
        const shardDate = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
        if (shardDate < keepFrom) {
          await del(blob.url);
          deleted.push(filename);
        }
      }
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);
  } catch (e) {
    console.error("[diagnostics] pruneOldLogs failed", e);
  }

  return { deleted };
}
