import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { listRecentMessages, type MailboxMessage } from "@/lib/marketing/mailbox-client";
import { DEFAULT_TENANT_ID } from "@/lib/marketing/tenants-store";

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
  tenantId: string;
  tag: EmailTag;
  priority: EmailPriority;
  aiSummary: string | null;
  read: boolean;
  archived: boolean;
}

async function readAll(): Promise<InboxEntry[]> {
  await ensureDataFileHydrated(INBOX_FILE, DEFAULT_JSON, { force: true });
  const all = readJsonFile<InboxEntry[]>(INBOX_FILE, DEFAULT_JSON);
  return all.map((e) => (e.tenantId ? e : { ...e, tenantId: DEFAULT_TENANT_ID }));
}

async function writeAll(items: InboxEntry[]): Promise<void> {
  await writeJsonFileAsync(INBOX_FILE, items, DEFAULT_JSON);
}

export async function listInboxEntries(tenantId: string): Promise<InboxEntry[]> {
  const all = await readAll();
  return all.filter((e) => e.tenantId === tenantId).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Pulls new messages from IMAP and merges them into the cache without
 * clobbering existing tags/priority/summary. NOTE: the mailbox itself is
 * still one shared IMAP inbox (IMAP_HOST/USER/PASS env vars) - true
 * per-tenant mailboxes need per-tenant credential storage, a follow-on to
 * this pass. Cache rows are scoped by tenantId today so that plugs in
 * without another data-model change once it lands.
 */
export async function syncInbox(tenantId: string, limit = 50): Promise<{ synced: number; total: number }> {
  const fresh = await listRecentMessages(limit);
  const cached = await readAll();
  const tenantEntries = cached.filter((e) => e.tenantId === tenantId);
  const otherEntries = cached.filter((e) => e.tenantId !== tenantId);
  const byUid = new Map(tenantEntries.map((e) => [e.uid, e]));

  let synced = 0;
  for (const message of fresh) {
    const existing = byUid.get(message.uid);
    if (existing) {
      byUid.set(message.uid, { ...existing, ...message, tag: existing.tag, priority: existing.priority });
    } else {
      byUid.set(message.uid, {
        ...message,
        tenantId,
        tag: "other",
        priority: "normal",
        aiSummary: null,
        read: message.seen,
        archived: false,
      });
      synced += 1;
    }
  }

  const merged = [...otherEntries, ...Array.from(byUid.values())];
  await writeAll(merged);
  return { synced, total: byUid.size };
}

export async function updateInboxEntry(
  uid: number,
  tenantId: string,
  patch: Partial<Pick<InboxEntry, "tag" | "priority" | "aiSummary" | "read" | "archived">>
): Promise<InboxEntry | null> {
  const all = await readAll();
  const entry = all.find((e) => e.uid === uid && e.tenantId === tenantId);
  if (!entry) return null;
  Object.assign(entry, patch);
  await writeAll(all);
  return entry;
}
