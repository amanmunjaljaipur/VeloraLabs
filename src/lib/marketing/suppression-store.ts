import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * CAN-SPAM/GDPR-style unsubscribe suppression list for the Email Suite.
 * Every campaign send must filter recipients against this list; the
 * unsubscribe API route adds to it. Kept separate from newsletter
 * subscribers (news-updates.json) since campaign emails are a distinct
 * list with its own opt-out.
 */

const SUPPRESSION_FILE = "marketing-email-suppression.json";
const DEFAULT_JSON = "[]";

export interface SuppressionEntry {
  email: string;
  reason: "unsubscribed" | "bounced" | "complained" | "manual";
  suppressedAt: string;
}

async function readAll(): Promise<SuppressionEntry[]> {
  await ensureDataFileHydrated(SUPPRESSION_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<SuppressionEntry[]>(SUPPRESSION_FILE, DEFAULT_JSON);
}

async function writeAll(items: SuppressionEntry[]): Promise<void> {
  await writeJsonFileAsync(SUPPRESSION_FILE, items, DEFAULT_JSON);
}

export async function listSuppressed(): Promise<SuppressionEntry[]> {
  return readAll();
}

export async function isSuppressed(email: string): Promise<boolean> {
  const all = await readAll();
  const normalized = email.trim().toLowerCase();
  return all.some((e) => e.email === normalized);
}

export async function addSuppression(
  email: string,
  reason: SuppressionEntry["reason"] = "unsubscribed"
): Promise<void> {
  const all = await readAll();
  const normalized = email.trim().toLowerCase();
  if (all.some((e) => e.email === normalized)) return;
  all.push({ email: normalized, reason, suppressedAt: new Date().toISOString() });
  await writeAll(all);
}

export async function removeSuppression(email: string): Promise<boolean> {
  const all = await readAll();
  const normalized = email.trim().toLowerCase();
  const idx = all.findIndex((e) => e.email === normalized);
  if (idx === -1) return false;
  all.splice(idx, 1);
  await writeAll(all);
  return true;
}

/** Filters a recipient list down to addresses that are safe to email. */
export async function filterSuppressed(emails: string[]): Promise<string[]> {
  const all = await readAll();
  const suppressed = new Set(all.map((e) => e.email));
  return emails.filter((e) => !suppressed.has(e.trim().toLowerCase()));
}
