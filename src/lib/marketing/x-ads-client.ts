import { createHmac, randomBytes } from "crypto";
import type { AdCampaign } from "@/lib/marketing/ad-campaigns-store";

/**
 * X Ads API client for paid campaigns. Unlike the organic v2 API
 * (x-client.ts, OAuth 2.0 bearer tokens), the Ads API's write endpoints
 * still require OAuth 1.0a request signing - a genuinely different auth
 * mechanism, so this file carries its own HMAC-SHA1 signer rather than
 * reusing anything from x-client.ts.
 *
 * Needs four app/account-level secrets from X's Developer Portal > Keys and
 * tokens (the "classic" API key/secret + access token/secret pair, not the
 * OAuth 2.0 Client ID/Secret used for organic posting). Kept as environment
 * variables - X_ADS_CONSUMER_KEY, X_ADS_CONSUMER_SECRET, X_ADS_ACCESS_TOKEN,
 * X_ADS_ACCESS_TOKEN_SECRET - matching this codebase's convention that
 * every *_SECRET is an env var, never typed into a browser form.
 *
 * Hierarchy: Campaign -> Line Item -> Promoted Tweet. Every object is
 * created with entity_status "PAUSED" - activation is a separate, explicit
 * call (setXCampaignStatus), matching this whole feature's "never
 * auto-spend" rule.
 *
 * Known simplifications (documented, not hidden):
 * - The promoted tweet is created via the Ads API's nullcast tweet endpoint
 *   (ads-only, never appears organically) but TEXT ONLY - bridging an
 *   OAuth-2-uploaded media ID into this OAuth-1.0a-authenticated call is
 *   unverified without live testing access, so campaign.creative.imageUrl
 *   is not attached here.
 * - Targeting is location-only, and only if targeting.locations already
 *   contains resolved X location targeting IDs (not free-text) - age/gender
 *   targeting_criteria are not implemented; X's age buckets are fixed
 *   enum values (e.g. AGE_18_TO_24) that don't map cleanly from raw
 *   min/max numbers without a lookup table.
 */

const ADS_API_VERSION = "12";
const ADS_API_BASE = `https://ads-api.x.com/${ADS_API_VERSION}`;
const FETCH_TIMEOUT_MS = 20_000;

function isXAdsConfigured(): boolean {
  return Boolean(
    process.env.X_ADS_CONSUMER_KEY &&
      process.env.X_ADS_CONSUMER_SECRET &&
      process.env.X_ADS_ACCESS_TOKEN &&
      process.env.X_ADS_ACCESS_TOKEN_SECRET
  );
}

export function isXAdsReady(): boolean {
  return isXAdsConfigured();
}

/** RFC 3986 percent-encoding - encodeURIComponent leaves !*'() unescaped, which OAuth 1.0a requires escaped. */
function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** Builds the Authorization header for one OAuth 1.0a-signed request. Query-string params must be included in `params` (not left in the URL) so they're covered by the signature. */
function buildOAuth1Header(method: string, url: string, params: Record<string, string>): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: process.env.X_ADS_CONSUMER_KEY as string,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: process.env.X_ADS_ACCESS_TOKEN as string,
    oauth_version: "1.0",
  };

  const allParams = { ...params, ...oauthParams };
  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(
      Object.keys(allParams)
        .sort()
        .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k]!)}`)
        .join("&")
    ),
  ].join("&");

  const signingKey = `${percentEncode(process.env.X_ADS_CONSUMER_SECRET as string)}&${percentEncode(
    process.env.X_ADS_ACCESS_TOKEN_SECRET as string
  )}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  const headerParams: Record<string, string> = { ...oauthParams, oauth_signature: signature };
  const header = Object.keys(headerParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k]!)}"`)
    .join(", ");
  return `OAuth ${header}`;
}

async function adsFetch<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  if (!isXAdsConfigured()) return null;
  const url = `${ADS_API_BASE}${path}`;
  try {
    const isBodyMethod = method === "POST" || method === "PUT";
    const fetchUrl = isBodyMethod ? url : `${url}?${new URLSearchParams(params).toString()}`;
    const res = await fetch(fetchUrl, {
      method,
      headers: {
        Authorization: buildOAuth1Header(method, url, params),
        ...(isBodyMethod ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      ...(isBodyMethod ? { body: new URLSearchParams(params).toString() } : {}),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error(`[marketing/x-ads] ${method} ${path} failed`, res.status, data);
      return null;
    }
    return data as T;
  } catch (error) {
    console.error(`[marketing/x-ads] ${method} ${path} errored`, error);
    return null;
  }
}

const OBJECTIVE_MAP: Record<AdCampaign["objective"], string> = {
  awareness: "REACH",
  traffic: "WEBSITE_CLICKS",
  engagement: "ENGAGEMENTS",
  leads: "WEBSITE_CLICKS",
  conversions: "WEBSITE_CLICKS",
};

async function getFundingInstrumentId(accountId: string): Promise<string | null> {
  const data = await adsFetch<{ data?: Array<{ id: string; entity_status: string }> }>(
    "GET",
    `/accounts/${accountId}/funding_instruments`
  );
  return data?.data?.find((f) => f.entity_status === "ACTIVE")?.id ?? data?.data?.[0]?.id ?? null;
}

export async function submitXCampaign(
  accountId: string,
  campaign: AdCampaign
): Promise<{ ok: true; platformIds: Record<string, string> } | { ok: false; error: string; platformIds: Record<string, string> }> {
  const platformIds: Record<string, string> = {};

  if (!isXAdsConfigured()) {
    return { ok: false, error: "X Ads API credentials are not configured (X_ADS_CONSUMER_KEY/SECRET + ACCESS_TOKEN/SECRET)", platformIds };
  }

  const fundingInstrumentId = await getFundingInstrumentId(accountId);
  if (!fundingInstrumentId) {
    return { ok: false, error: "No active funding instrument found on this X Ads account - add a payment method in X Ads Manager first", platformIds };
  }

  const dailyBudgetMicro =
    campaign.budget.type === "daily"
      ? Math.round(campaign.budget.amount * 1_000_000)
      : Math.round((campaign.budget.amount / 30) * 1_000_000);

  const campaignRes = await adsFetch<{ data?: { id: string } }>("POST", `/accounts/${accountId}/campaigns`, {
    name: campaign.name,
    funding_instrument_id: fundingInstrumentId,
    daily_budget_amount_local_micro: String(dailyBudgetMicro),
    entity_status: "PAUSED",
    start_time: new Date(campaign.schedule.startDate).toISOString(),
    ...(campaign.schedule.endDate ? { end_time: new Date(campaign.schedule.endDate).toISOString() } : {}),
    standard_delivery: "true",
  });
  if (!campaignRes?.data?.id) {
    return { ok: false, error: "X rejected the campaign", platformIds };
  }
  platformIds.campaignId = campaignRes.data.id;

  const lineItemRes = await adsFetch<{ data?: { id: string } }>("POST", `/accounts/${accountId}/line_items`, {
    campaign_id: campaignRes.data.id,
    name: `${campaign.name} - Line Item`,
    objective: OBJECTIVE_MAP[campaign.objective],
    product_type: "PROMOTED_TWEETS",
    placements: "ALL_ON_TWITTER",
    bid_type: "AUTO",
    entity_status: "PAUSED",
  });
  if (!lineItemRes?.data?.id) {
    return { ok: false, error: "X rejected the line item", platformIds };
  }
  platformIds.lineItemId = lineItemRes.data.id;

  const locations = campaign.targeting.locations.filter((l) => /^[a-zA-Z0-9]+$/.test(l));
  if (locations.length > 0) {
    for (const locationId of locations) {
      const targetingRes = await adsFetch<{ data?: { id: string } }>("POST", `/accounts/${accountId}/targeting_criteria`, {
        line_item_id: lineItemRes.data.id,
        targeting_type: "LOCATION",
        targeting_value: locationId,
      });
      if (!targetingRes?.data?.id) {
        console.error("[marketing/x-ads] location targeting skipped for", locationId);
      }
    }
  }

  const tweetText = campaign.creative.linkUrl
    ? `${campaign.creative.body} ${campaign.creative.linkUrl}`.trim()
    : campaign.creative.body;
  const tweetRes = await adsFetch<{ data?: { id: string } }>("POST", `/accounts/${accountId}/tweet`, {
    text: tweetText,
    nullcast: "true",
    as_user_id: accountId,
  });
  if (!tweetRes?.data?.id) {
    return { ok: false, error: "X rejected the promoted tweet content", platformIds };
  }
  platformIds.tweetId = tweetRes.data.id;

  const promotedRes = await adsFetch<{ data?: Array<{ id: string }> }>("POST", `/accounts/${accountId}/promoted_tweets`, {
    line_item_id: lineItemRes.data.id,
    tweet_ids: tweetRes.data.id,
  });
  if (!promotedRes?.data?.[0]?.id) {
    return { ok: false, error: "X rejected promoting the tweet", platformIds };
  }
  platformIds.promotedTweetId = promotedRes.data[0].id;

  return { ok: true, platformIds };
}

export async function setXCampaignStatus(
  accountId: string,
  platformIds: Record<string, string>,
  status: "ACTIVE" | "PAUSED"
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!platformIds.campaignId || !platformIds.lineItemId) {
    return { ok: false, error: "No X campaign to update" };
  }

  const campaignRes = await adsFetch<{ data?: { id: string } }>(
    "PUT",
    `/accounts/${accountId}/campaigns/${platformIds.campaignId}`,
    { entity_status: status }
  );
  if (!campaignRes?.data?.id) return { ok: false, error: "X rejected the campaign status change" };

  const lineItemRes = await adsFetch<{ data?: { id: string } }>(
    "PUT",
    `/accounts/${accountId}/line_items/${platformIds.lineItemId}`,
    { entity_status: status }
  );
  if (!lineItemRes?.data?.id) return { ok: false, error: "X rejected the line item status change" };

  return { ok: true };
}

export async function getXCampaignInsights(
  accountId: string,
  lineItemId: string
): Promise<Record<string, number> | null> {
  const data = await adsFetch<{
    data?: Array<{ id_data?: Array<{ metrics?: Record<string, number[] | null> }> }>;
  }>("GET", `/stats/accounts/${accountId}`, {
    entity: "LINE_ITEM",
    entity_ids: lineItemId,
    metric_groups: "ENGAGEMENT,BILLING",
    placement: "ALL_ON_TWITTER",
    granularity: "TOTAL",
  });
  const metrics = data?.data?.[0]?.id_data?.[0]?.metrics;
  if (!metrics) return null;
  return {
    impressions: metrics.impressions?.[0] ?? 0,
    clicks: metrics.clicks?.[0] ?? 0,
    spend: (metrics.billed_charge_local_micro?.[0] ?? 0) / 1_000_000,
  };
}
