import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Per-tenant paid-ads configuration - separate from accounts-store.ts
 * because ad accounts are a different entity from the Pages/Organization/
 * User rows used for organic posting, and need their own credential:
 *
 * - Meta: campaigns are created under an Ad Account (act_XXXXXXXXX), which
 *   this store holds the ID for. Calls also need a User access token
 *   carrying ads_management scope - captured automatically off the long-
 *   lived token during the Meta OAuth callback (see connect/meta/callback),
 *   since Page tokens derived from it do NOT inherit ad-account-level
 *   permissions.
 * - LinkedIn: reuses the org's already-connected access token (once it
 *   carries the r_ads/rw_ads scopes added to buildLinkedInOrgAuthUrl) - just
 *   needs the sponsored account URN, entered here.
 * - X: Ads API writes require OAuth 1.0a signing (a different auth
 *   mechanism from the OAuth 2.0 bearer tokens the organic v2 API uses),
 *   which needs consumer key/secret + access token/secret. Those four
 *   values are treated as secrets - kept in environment variables
 *   (X_ADS_CONSUMER_KEY / X_ADS_CONSUMER_SECRET / X_ADS_ACCESS_TOKEN /
 *   X_ADS_ACCESS_TOKEN_SECRET), matching this codebase's convention that
 *   every *_SECRET is an env var, never typed into a browser form. This
 *   store only holds X's numeric ads account ID.
 */

const AD_ACCOUNTS_FILE = "marketing-ad-accounts.json";
const DEFAULT_JSON = "[]";

export type AdsPlatform = "meta" | "linkedin" | "x";

export interface AdAccountConfig {
  tenantId: string;
  platform: AdsPlatform;
  /** act_XXXXXXXXX (Meta), urn:li:sponsoredAccount:XXXXXXXX (LinkedIn), or numeric account ID (X) */
  adAccountId: string;
  /** Meta only - long-lived user token w/ ads_management scope, captured off the OAuth callback. Never sent to the browser. */
  metaUserAccessToken?: string | null;
  updatedAt: string;
  updatedBy: string;
}

/** The only shape ever sent to the browser - no token, ever. */
export interface PublicAdAccountConfig {
  platform: AdsPlatform;
  adAccountId: string;
  configured: boolean;
}

async function readAll(): Promise<AdAccountConfig[]> {
  await ensureDataFileHydrated(AD_ACCOUNTS_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<AdAccountConfig[]>(AD_ACCOUNTS_FILE, DEFAULT_JSON);
}

async function writeAll(items: AdAccountConfig[]): Promise<void> {
  await writeJsonFileAsync(AD_ACCOUNTS_FILE, items, DEFAULT_JSON);
}

export function toPublicAdAccount(config: AdAccountConfig): PublicAdAccountConfig {
  return {
    platform: config.platform,
    adAccountId: config.adAccountId,
    configured: Boolean(config.adAccountId),
  };
}

export async function listAdAccounts(tenantId: string): Promise<AdAccountConfig[]> {
  const all = await readAll();
  return all.filter((a) => a.tenantId === tenantId);
}

export async function getAdAccount(tenantId: string, platform: AdsPlatform): Promise<AdAccountConfig | null> {
  const all = await readAll();
  return all.find((a) => a.tenantId === tenantId && a.platform === platform) ?? null;
}

/** Upserts the ad account ID an admin enters in the Campaigns settings panel. Preserves any existing metaUserAccessToken. */
export async function setAdAccountId(
  tenantId: string,
  platform: AdsPlatform,
  adAccountId: string,
  updatedBy: string
): Promise<AdAccountConfig> {
  const all = await readAll();
  const idx = all.findIndex((a) => a.tenantId === tenantId && a.platform === platform);
  const record: AdAccountConfig = {
    tenantId,
    platform,
    adAccountId: adAccountId.trim(),
    metaUserAccessToken: idx >= 0 ? all[idx]!.metaUserAccessToken ?? null : null,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  await writeAll(all);
  return record;
}

/** Called from the Meta OAuth callback so ad-account calls always have a fresh token, without a separate ads-specific connect flow. */
export async function saveMetaUserAccessToken(tenantId: string, accessToken: string): Promise<void> {
  const all = await readAll();
  const idx = all.findIndex((a) => a.tenantId === tenantId && a.platform === "meta");
  if (idx >= 0) {
    all[idx] = { ...all[idx]!, metaUserAccessToken: accessToken, updatedAt: new Date().toISOString() };
  } else {
    all.push({
      tenantId,
      platform: "meta",
      adAccountId: "",
      metaUserAccessToken: accessToken,
      updatedAt: new Date().toISOString(),
      updatedBy: "oauth-callback",
    });
  }
  await writeAll(all);
}
