import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Server-only store for connected marketing account credentials (Facebook
 * Page tokens, Instagram Business Account IDs, LinkedIn organization
 * tokens, X user tokens). Access tokens NEVER leave this module - every API
 * route and every client-facing shape strips them before returning. This
 * mirrors how manual-users.json stores password hashes, not plaintext: the
 * file itself is sensitive, so it is Blob-persisted with the same
 * strong-write guarantee as other auth-adjacent stores, and it is never
 * read by anything client-side.
 */

const ACCOUNTS_FILE = "marketing-accounts.json";
const DEFAULT_JSON = "[]";

export type MarketingPlatform = "facebook" | "instagram" | "linkedin" | "x";

export interface ConnectedAccount {
  id: string;
  platform: MarketingPlatform;
  /** Facebook Page ID, Instagram Business Account ID, LinkedIn organization URN, or X user ID */
  externalId: string;
  name: string;
  picture?: string | null;
  accessToken: string;
  /** Facebook long-lived Page tokens do not expire; LinkedIn and X tokens do - null means "does not expire" */
  expiresAt: string | null;
  /** X only: needed to mint a new access token via refresh_token once expiresAt passes (offline.access scope) */
  refreshToken?: string | null;
  connectedBy: string;
  connectedAt: string;
}

/** The only shape ever sent to the browser - no token, ever. */
export interface PublicAccount {
  id: string;
  platform: MarketingPlatform;
  name: string;
  picture?: string | null;
  expiringSoon: boolean;
}

async function readAll(): Promise<ConnectedAccount[]> {
  await ensureDataFileHydrated(ACCOUNTS_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<ConnectedAccount[]>(ACCOUNTS_FILE, DEFAULT_JSON);
}

async function writeAll(items: ConnectedAccount[]): Promise<void> {
  await writeJsonFileAsync(ACCOUNTS_FILE, items, DEFAULT_JSON);
}

export function toPublicAccount(account: ConnectedAccount): PublicAccount {
  // Accounts with a refresh token (currently just X) renew themselves
  // silently via getValidXAccessToken - surfacing "expiring soon" for those
  // is a false alarm every admin would see immediately after connecting,
  // not something that actually needs action.
  const expiringSoon = Boolean(
    !account.refreshToken &&
      account.expiresAt &&
      new Date(account.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
  );
  return {
    id: account.id,
    platform: account.platform,
    name: account.name,
    picture: account.picture,
    expiringSoon,
  };
}

export async function listConnectedAccounts(): Promise<ConnectedAccount[]> {
  return readAll();
}

export async function listPublicAccounts(): Promise<PublicAccount[]> {
  const all = await readAll();
  return all.map(toPublicAccount);
}

export async function getConnectedAccount(id: string): Promise<ConnectedAccount | null> {
  const all = await readAll();
  return all.find((a) => a.id === id) ?? null;
}

/**
 * Upsert by (platform, externalId) so re-connecting refreshes the token
 * instead of duplicating the row. Also used internally by the X client to
 * write back a rotated access/refresh token pair after a silent refresh -
 * same reasoning applies: same (platform, externalId) means "update the
 * existing row in place", not "create a new one".
 */
export async function upsertConnectedAccount(input: {
  platform: MarketingPlatform;
  externalId: string;
  name: string;
  picture?: string | null;
  accessToken: string;
  expiresAt: string | null;
  refreshToken?: string | null;
  connectedBy: string;
}): Promise<ConnectedAccount> {
  const all = await readAll();
  const idx = all.findIndex((a) => a.platform === input.platform && a.externalId === input.externalId);

  const record: ConnectedAccount = {
    id: idx >= 0 ? all[idx]!.id : randomUUID(),
    platform: input.platform,
    externalId: input.externalId,
    name: input.name,
    picture: input.picture ?? null,
    accessToken: input.accessToken,
    expiresAt: input.expiresAt,
    refreshToken: input.refreshToken ?? (idx >= 0 ? all[idx]!.refreshToken ?? null : null),
    connectedBy: input.connectedBy,
    connectedAt: idx >= 0 ? all[idx]!.connectedAt : new Date().toISOString(),
  };

  if (idx >= 0) all[idx] = record;
  else all.push(record);

  await writeAll(all);
  return record;
}

export async function disconnectAccount(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}
