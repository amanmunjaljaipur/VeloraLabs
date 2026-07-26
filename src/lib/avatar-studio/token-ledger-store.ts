import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Per-user token balance + full consumption/refund ledger (Section 6/13).
 * Every job logs tokens consumed; failed jobs get refunded (Section 13's
 * new requirement). Balances reset on a period (monthly, matching the
 * site's existing usage-limit cadence) rather than accumulating forever.
 */

const BALANCES_FILE = "avatar-token-balances.json";
const LEDGER_FILE = "avatar-token-ledger.json";
const DEFAULT_JSON = "[]";

const FREE_TIER_MONTHLY_TOKENS = 200;
const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

export interface TokenBalance {
  email: string;
  balance: number;
  periodResetAt: string;
}

export type LedgerEntryKind = "consume" | "refund" | "grant";

export interface TokenLedgerEntry {
  id: string;
  email: string;
  jobId: string | null;
  kind: LedgerEntryKind;
  modelId: string | null;
  qualityTier: string | null;
  tokens: number;
  timestamp: string;
  note: string | null;
}

async function readBalances(): Promise<TokenBalance[]> {
  await ensureDataFileHydrated(BALANCES_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<TokenBalance[]>(BALANCES_FILE, DEFAULT_JSON);
}
async function writeBalances(items: TokenBalance[]): Promise<void> {
  await writeJsonFileAsync(BALANCES_FILE, items, DEFAULT_JSON);
}
async function readLedger(): Promise<TokenLedgerEntry[]> {
  await ensureDataFileHydrated(LEDGER_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<TokenLedgerEntry[]>(LEDGER_FILE, DEFAULT_JSON);
}
async function writeLedger(items: TokenLedgerEntry[]): Promise<void> {
  await writeJsonFileAsync(LEDGER_FILE, items, DEFAULT_JSON);
}

/** Reads (and lazily creates/resets) a user's balance - the free-tier allotment renews automatically once its period elapses. */
export async function getBalance(email: string): Promise<TokenBalance> {
  const normalizedEmail = email.toLowerCase();
  const all = await readBalances();
  const idx = all.findIndex((b) => b.email === normalizedEmail);
  const now = Date.now();

  if (idx < 0) {
    const fresh: TokenBalance = {
      email: normalizedEmail,
      balance: FREE_TIER_MONTHLY_TOKENS,
      periodResetAt: new Date(now + MS_PER_MONTH).toISOString(),
    };
    all.push(fresh);
    await writeBalances(all);
    return fresh;
  }

  const existing = all[idx]!;
  if (new Date(existing.periodResetAt).getTime() <= now) {
    const reset: TokenBalance = {
      email: normalizedEmail,
      balance: FREE_TIER_MONTHLY_TOKENS,
      periodResetAt: new Date(now + MS_PER_MONTH).toISOString(),
    };
    all[idx] = reset;
    await writeBalances(all);
    return reset;
  }
  return existing;
}

/** Deducts tokens and logs the ledger entry - callers must check sufficient balance first via getBalance(). */
export async function consumeTokens(
  email: string,
  amount: number,
  meta: { jobId: string; modelId: string; qualityTier: string }
): Promise<TokenBalance> {
  const normalizedEmail = email.toLowerCase();
  const balance = await getBalance(normalizedEmail);
  const all = await readBalances();
  const idx = all.findIndex((b) => b.email === normalizedEmail);
  const next: TokenBalance = { ...balance, balance: Math.max(0, balance.balance - amount) };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  await writeBalances(all);

  const ledger = await readLedger();
  ledger.push({
    id: randomUUID(),
    email: normalizedEmail,
    jobId: meta.jobId,
    kind: "consume",
    modelId: meta.modelId,
    qualityTier: meta.qualityTier,
    tokens: amount,
    timestamp: new Date().toISOString(),
    note: null,
  });
  await writeLedger(ledger);
  return next;
}

/** Section 13: failed jobs refund consumed tokens. */
export async function refundTokens(email: string, amount: number, jobId: string, note: string): Promise<TokenBalance> {
  const normalizedEmail = email.toLowerCase();
  const balance = await getBalance(normalizedEmail);
  const all = await readBalances();
  const idx = all.findIndex((b) => b.email === normalizedEmail);
  const next: TokenBalance = { ...balance, balance: balance.balance + amount };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  await writeBalances(all);

  const ledger = await readLedger();
  ledger.push({
    id: randomUUID(),
    email: normalizedEmail,
    jobId,
    kind: "refund",
    modelId: null,
    qualityTier: null,
    tokens: amount,
    timestamp: new Date().toISOString(),
    note,
  });
  await writeLedger(ledger);
  return next;
}

export async function getLedgerForUser(email: string, limit = 100): Promise<TokenLedgerEntry[]> {
  const all = await readLedger();
  return all
    .filter((e) => e.email === email.toLowerCase())
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

/**
 * Net outstanding (not-yet-refunded) tokens for one job, computed from the
 * ledger itself rather than trusting AvatarJob.tokensReserved. The job
 * record's field is a single mutable value written by a read-modify-write
 * (updateJob) that can race with the queue processor's near-immediate
 * after()-triggered read on this platform's eventually-consistent Blob
 * store - live testing showed a job created and processed within the same
 * request lifecycle could see a stale tokensReserved of 0 and skip its
 * refund entirely. The ledger is additive-only (never overwritten in
 * place), so summing it is safe to call repeatedly - a job already fully
 * refunded correctly returns 0, and calling this after issuing a refund
 * immediately reflects that refund, making refund logic that uses this
 * function naturally idempotent.
 */
export async function getReservedTokensForJob(jobId: string): Promise<number> {
  const all = await readLedger();
  const forJob = all.filter((e) => e.jobId === jobId);
  const consumed = forJob.filter((e) => e.kind === "consume").reduce((sum, e) => sum + e.tokens, 0);
  const refunded = forJob.filter((e) => e.kind === "refund").reduce((sum, e) => sum + e.tokens, 0);
  return Math.max(0, consumed - refunded);
}

/**
 * True if any refund (full or partial) has ever been logged for this job.
 * Used by the cron reconciliation pass to tell "refund-on-failure never ran
 * at all" (safe to refund the full outstanding balance) apart from "a
 * correct partial refund already ran" (e.g. a long-form job that finished
 * some segments before failing - the remaining balance is legitimately
 * spent and must not be refunded again). Reconciliation only ever touches
 * the first case.
 */
export async function hasAnyRefund(jobId: string): Promise<boolean> {
  const all = await readLedger();
  return all.some((e) => e.jobId === jobId && e.kind === "refund");
}
