import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { DEFAULT_TENANT_ID } from "@/lib/marketing/tenants-store";

/**
 * Server-only store for connected mailbox credentials (IMAP + optional
 * separate SMTP), the thing that lets one workspace read and send from
 * several real inboxes - support@, sales@, hello@, a founder's personal
 * Gmail, whatever - and manage them from one Email Suite, the way Gmail
 * lets you add and switch between multiple accounts. Mirrors
 * accounts-store.ts exactly: passwords NEVER leave this module, every
 * client-facing shape (PublicMailbox) strips them before returning, and
 * every record carries a tenantId for the same workspace isolation.
 *
 * Before this store existed, the Email Suite read exactly one mailbox
 * configured via IMAP_HOST/IMAP_USER/IMAP_PASS env vars. That mailbox
 * still works and still shows up - see LEGACY_MAILBOX_ID in
 * mailbox-client.ts - it just now appears as one account among however
 * many the workspace has added on top, instead of being the only option.
 */

const MAILBOXES_FILE = "marketing-mailboxes.json";
const DEFAULT_JSON = "[]";

/** Rotates through a fixed set of the app's own palette colors for the account-switcher dots/avatars. */
const SWATCHES = ["#0F6E56", "#185FA5", "#993C1D", "#72243E", "#3B6D11", "#854F0B", "#534AB7", "#0C447C"];

export interface ConnectedMailbox {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  color: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapUser: string;
  imapPass: string;
  /** null = reuse the site's existing SMTP/Resend transactional sender for outbound mail from this address */
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPass: string | null;
  status: "connected" | "error";
  lastError: string | null;
  lastSyncedAt: string | null;
  connectedBy: string;
  connectedAt: string;
}

/** The only shape ever sent to the browser - no password, ever. */
export interface PublicMailbox {
  id: string;
  email: string;
  displayName: string;
  color: string;
  usesCustomSmtp: boolean;
  status: ConnectedMailbox["status"];
  lastError: string | null;
  lastSyncedAt: string | null;
}

async function readAll(): Promise<ConnectedMailbox[]> {
  await ensureDataFileHydrated(MAILBOXES_FILE, DEFAULT_JSON, { force: true });
  const all = readJsonFile<ConnectedMailbox[]>(MAILBOXES_FILE, DEFAULT_JSON);
  return all.map((m) => (m.tenantId ? m : { ...m, tenantId: DEFAULT_TENANT_ID }));
}

async function writeAll(items: ConnectedMailbox[]): Promise<void> {
  await writeJsonFileAsync(MAILBOXES_FILE, items, DEFAULT_JSON);
}

export function toPublicMailbox(m: ConnectedMailbox): PublicMailbox {
  return {
    id: m.id,
    email: m.email,
    displayName: m.displayName,
    color: m.color,
    usesCustomSmtp: Boolean(m.smtpHost),
    status: m.status,
    lastError: m.lastError,
    lastSyncedAt: m.lastSyncedAt,
  };
}

export async function listMailboxes(tenantId: string): Promise<ConnectedMailbox[]> {
  const all = await readAll();
  return all.filter((m) => m.tenantId === tenantId);
}

export async function listPublicMailboxes(tenantId: string): Promise<PublicMailbox[]> {
  return (await listMailboxes(tenantId)).map(toPublicMailbox);
}

export async function getMailbox(id: string, tenantId: string): Promise<ConnectedMailbox | null> {
  const all = await readAll();
  return all.find((m) => m.id === id && m.tenantId === tenantId) ?? null;
}

/** Upsert by (tenantId, email) so reconnecting/fixing credentials updates the existing row instead of duplicating it. */
export async function upsertMailbox(input: {
  tenantId: string;
  email: string;
  displayName?: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapUser: string;
  imapPass: string;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean;
  smtpUser?: string | null;
  smtpPass?: string | null;
  connectedBy: string;
}): Promise<ConnectedMailbox> {
  const all = await readAll();
  const idx = all.findIndex(
    (m) => m.tenantId === input.tenantId && m.email.toLowerCase() === input.email.toLowerCase()
  );
  const tenantCount = all.filter((m) => m.tenantId === input.tenantId).length;

  const record: ConnectedMailbox = {
    id: idx >= 0 ? all[idx]!.id : randomUUID(),
    tenantId: input.tenantId,
    email: input.email,
    displayName: input.displayName?.trim() || input.email,
    color: idx >= 0 ? all[idx]!.color : SWATCHES[tenantCount % SWATCHES.length]!,
    imapHost: input.imapHost,
    imapPort: input.imapPort,
    imapSecure: input.imapSecure,
    imapUser: input.imapUser,
    imapPass: input.imapPass,
    smtpHost: input.smtpHost ?? null,
    smtpPort: input.smtpPort ?? null,
    smtpSecure: input.smtpSecure ?? true,
    smtpUser: input.smtpUser ?? null,
    smtpPass: input.smtpPass ?? null,
    status: "connected",
    lastError: null,
    lastSyncedAt: idx >= 0 ? all[idx]!.lastSyncedAt : null,
    connectedBy: input.connectedBy,
    connectedAt: idx >= 0 ? all[idx]!.connectedAt : new Date().toISOString(),
  };

  if (idx >= 0) all[idx] = record;
  else all.push(record);

  await writeAll(all);
  return record;
}

export async function updateMailboxStatus(
  id: string,
  tenantId: string,
  patch: { status: ConnectedMailbox["status"]; lastError?: string | null; lastSyncedAt?: string | null }
): Promise<void> {
  const all = await readAll();
  const m = all.find((x) => x.id === id && x.tenantId === tenantId);
  if (!m) return;
  Object.assign(m, patch);
  await writeAll(all);
}

export async function removeMailbox(id: string, tenantId: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((m) => !(m.id === id && m.tenantId === tenantId));
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}
