import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import {
  LEGACY_MAILBOX_ID,
  getLegacyCredentials,
  listRecentMessages,
  type MailboxCredentials,
  type MailboxMessage,
} from "@/lib/marketing/mailbox-client";
import { listMailboxes, updateMailboxStatus, type ConnectedMailbox } from "@/lib/marketing/mailboxes-store";
import { DEFAULT_TENANT_ID } from "@/lib/marketing/tenants-store";

/**
 * Cached mailbox metadata layered on top of mailbox-client's live IMAP
 * fetch, now merged across every mailbox a workspace has connected (see
 * mailboxes-store.ts) into one unified inbox - the "manage multiple emails
 * in a single place" behavior modeled on Gmail's multi-account inbox.
 *
 * A message's identity is (mailboxId, uid) - the same numeric uid can
 * legitimately exist in two different mailboxes for two different
 * messages, so `id` (a stable "<mailboxId>:<uid>" string) is what the API
 * and UI treat as the real primary key. `uid` alone is only meaningful
 * together with its mailboxId when talking back to IMAP.
 *
 * IMAP round-trips are slow (multi-second, times the number of connected
 * mailboxes), so the admin Inbox view reads this Blob-persisted cache and
 * only re-syncs on demand. AI summary/tag/priority (from ai-email-assist.ts)
 * are stored here too, so they're computed once per message rather than on
 * every page load.
 */

const INBOX_FILE = "marketing-inbox.json";
const DEFAULT_JSON = "[]";

export type EmailTag = "lead" | "support" | "partnership" | "spam" | "other";
export type EmailPriority = "high" | "normal" | "low";

export interface InboxEntry extends MailboxMessage {
  id: string;
  tenantId: string;
  mailboxId: string;
  tag: EmailTag;
  priority: EmailPriority;
  aiSummary: string | null;
  read: boolean;
  archived: boolean;
}

export interface MailboxSource {
  mailboxId: string;
  email: string;
  displayName: string;
  color: string;
  creds: MailboxCredentials;
  isLegacy: boolean;
}

function entryId(mailboxId: string, uid: number): string {
  return `${mailboxId}:${uid}`;
}

/** Every mailbox this tenant should sync from - stored connections plus the legacy env-configured one, if any. */
export async function resolveActiveMailboxes(tenantId: string): Promise<MailboxSource[]> {
  const stored = await listMailboxes(tenantId);
  const sources: MailboxSource[] = stored.map((m) => ({
    mailboxId: m.id,
    email: m.email,
    displayName: m.displayName,
    color: m.color,
    creds: { host: m.imapHost, port: m.imapPort, secure: m.imapSecure, user: m.imapUser, pass: m.imapPass },
    isLegacy: false,
  }));

  const legacy = getLegacyCredentials();
  if (legacy && !stored.some((m) => m.email.toLowerCase() === legacy.user.toLowerCase())) {
    sources.push({
      mailboxId: LEGACY_MAILBOX_ID,
      email: legacy.user,
      displayName: "Primary inbox",
      color: "#0F6E56",
      creds: legacy,
      isLegacy: true,
    });
  }

  return sources;
}

async function readAll(): Promise<InboxEntry[]> {
  await ensureDataFileHydrated(INBOX_FILE, DEFAULT_JSON, { force: true });
  const all = readJsonFile<InboxEntry[]>(INBOX_FILE, DEFAULT_JSON);
  return all.map((e) => {
    const tenantId = e.tenantId ?? DEFAULT_TENANT_ID;
    const mailboxId = e.mailboxId ?? LEGACY_MAILBOX_ID;
    const id = e.id ?? entryId(mailboxId, e.uid);
    return e.tenantId && e.mailboxId && e.id ? e : { ...e, tenantId, mailboxId, id };
  });
}

async function writeAll(items: InboxEntry[]): Promise<void> {
  await writeJsonFileAsync(INBOX_FILE, items, DEFAULT_JSON);
}

export async function listInboxEntries(tenantId: string): Promise<InboxEntry[]> {
  const all = await readAll();
  return all.filter((e) => e.tenantId === tenantId).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Pulls new messages from every connected mailbox and merges them into the
 * cache without clobbering existing tags/priority/summary. A mailbox whose
 * credentials have gone bad (password rotated, host unreachable) is marked
 * "error" on its own record rather than failing the whole sync - the other
 * mailboxes still come through.
 */
export async function syncInbox(tenantId: string, limit = 50): Promise<{ synced: number; total: number }> {
  const mailboxes = await resolveActiveMailboxes(tenantId);
  const cached = await readAll();
  const tenantEntries = cached.filter((e) => e.tenantId === tenantId);
  const otherEntries = cached.filter((e) => e.tenantId !== tenantId);
  const byId = new Map(tenantEntries.map((e) => [e.id, e]));

  let synced = 0;

  for (const source of mailboxes) {
    let fresh: MailboxMessage[] = [];
    try {
      fresh = await listRecentMessages(source.creds, limit);
      if (!source.isLegacy) {
        await updateMailboxStatus(source.mailboxId, tenantId, {
          status: "connected",
          lastError: null,
          lastSyncedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Inbox sync failed for mailbox ${source.email}:`, error);
      if (!source.isLegacy) {
        await updateMailboxStatus(source.mailboxId, tenantId, {
          status: "error",
          lastError: error instanceof Error ? error.message : "Sync failed",
        });
      }
      continue;
    }

    for (const message of fresh) {
      const id = entryId(source.mailboxId, message.uid);
      const existing = byId.get(id);
      if (existing) {
        byId.set(id, { ...existing, ...message, id, mailboxId: source.mailboxId, tag: existing.tag, priority: existing.priority });
      } else {
        byId.set(id, {
          ...message,
          id,
          tenantId,
          mailboxId: source.mailboxId,
          tag: "other",
          priority: "normal",
          aiSummary: null,
          read: message.seen,
          archived: false,
        });
        synced += 1;
      }
    }
  }

  const merged = [...otherEntries, ...Array.from(byId.values())];
  await writeAll(merged);
  return { synced, total: byId.size };
}

export async function updateInboxEntry(
  id: string,
  tenantId: string,
  patch: Partial<Pick<InboxEntry, "tag" | "priority" | "aiSummary" | "read" | "archived">>
): Promise<InboxEntry | null> {
  const all = await readAll();
  const entry = all.find((e) => e.id === id && e.tenantId === tenantId);
  if (!entry) return null;
  Object.assign(entry, patch);
  await writeAll(all);
  return entry;
}
