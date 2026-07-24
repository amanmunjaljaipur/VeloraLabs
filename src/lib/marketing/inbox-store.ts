import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { listRecentMessages, type MailboxMessage } from "@/lib/marketing/mailbox-client";

/**
 * Cached mailbox metadata layered on top of mailbox-client's live IMAP
 * fetch. IMAP round-trips are slow (multi-second), so the admin Inbox view
 * reads this Blob-persisted cache and only re-syncs on demand. AI
 * summary/tag/priority (from ai-email-assist.ts) are stored here too, keyed
 * by uid, so they're computed once per message rather than on every page
 * load.
 */

const INBOX_FILE = "marketing-inbox.json";
const DEFAULT_JSON = "[]";

export type EmailTag = "lead" | "support" | "partnership" | "spam" | "other";
export type EmailPriority = "high" | "normal" | "low";

export interface InboxEntry extends MailboxMessage {
  tag: EmailTag;
  priority: EmailPriority;
  aiSummary: string | null;
  read: boolean;
  archived: boolean;
}

async function readAll(): Promise<InboxEntry[]> {
  await ensureDataFileHydrated(INBOX_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<InboxEntry[]>(INBOX_FILE, DEFAULT_JSON);
}

async function writeAll(items: InboxEntry[]): Promise<void> {
  await writeJsonFileAsync(INBOX_FILE, items, DEFAULT_JSON);
}

export async function listInboxEntries(): Promise<InboxEntry[]> {
  const all = await readAll();
  return [...all].sort((a, b) => b.date.localeCompare(a.date));
}

/** Pulls new messages from IMAP and merges them into the cache without clobbering existing tags/priority/summary. */
export async function syncInbox(limit = 50): Promise<{ synced: number; total: number }> {
  const fresh = await listRecentMessages(limit);
  const cached = await readAll();
  const byUid = new Map(cached.map((e) => [e.uid, e]));

  let synced = 0;
  for (const message of fresh) {
    const existing = byUid.get(message.uid);
    if (existing) {
      byUid.set(message.uid, { ...existing, ...message, tag: existing.tag, priority: existing.priority });
    } else {
      byUid.set(message.uid, {
        ...message,
        tag: "other",
        priority: "normal",
        aiSummary: null,
        read: message.seen,
        archived: false,
      });
      synced += 1;
    }
  }

  const merged = Array.from(byUid.values());
  await writeAll(merged);
  return { synced, total: merged.length };
}

export async function updateInboxEntry(
  uid: number,
  patch: Partial<Pick<InboxEntry, "tag" | "priority" | "aiSummary" | "read" | "archived">>
): Promise<InboxEntry | null> {
  const all = await readAll();
  const entry = all.find((e) => e.uid === uid);
  if (!entry) return null;
  Object.assign(entry, patch);
  await writeAll(all);
  return entry;
}
