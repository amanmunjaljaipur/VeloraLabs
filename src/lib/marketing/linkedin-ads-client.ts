import { LINKEDIN_API_VERSION, REST_BASE, restFetch } from "@/lib/marketing/linkedin-client";
import type { AdCampaign } from "@/lib/marketing/ad-campaigns-store";

/**
 * LinkedIn Marketing API client for paid campaigns. Hierarchy is Campaign
 * Group -> Campaign -> Creative (one level shallower than Meta's). Every
 * object is created with status "PAUSED" - activation is a separate,
 * explicit call (setLinkedInCampaignStatus), matching this whole feature's
 * "never auto-spend" rule.
 *
 * Requires the app to have LinkedIn's Marketing Developer Platform product
 * enabled (separate from, and harder to get approved than, the Community
 * Management API already used for organic posting) - see the scope comment
 * on buildLinkedInOrgAuthUrl in linkedin-client.ts.
 *
 * Known simplifications (documented, not hidden):
 * - Targeting only accepts LinkedIn geo URNs (e.g. urn:li:geo:103644278 for
 *   Worldwide) via targeting.locations - free-text country names need
 *   LinkedIn's separate Geo Targeting lookup API to resolve, not
 *   implemented here. Falls back to Worldwide if none are given.
 * - Creative is Direct Sponsored Content: an underlying post is created
 *   with feedDistribution "NONE" (ads-only, never shows organically), then
 *   referenced by the ad creative - the standard pattern for ads whose copy
 *   differs from what's published organically.
 */

const FETCH_TIMEOUT_MS = 20_000;
const WORLDWIDE_GEO_URN = "urn:li:geo:103644278";

const OBJECTIVE_MAP: Record<AdCampaign["objective"], string> = {
  awareness: "BRAND_AWARENESS",
  traffic: "WEBSITE_VISIT",
  engagement: "ENGAGEMENT",
  leads: "LEAD_GENERATION",
  conversions: "WEBSITE_CONVERSION",
};

/** LinkedIn's REST path wants the bare numeric ID; body fields want the full sponsoredAccount URN - accept either input form. */
function numericAdAccountId(adAccountId: string): string {
  const match = adAccountId.match(/(\d+)\s*$/);
  return match ? match[1]! : adAccountId;
}
function accountUrn(adAccountId: string): string {
  return adAccountId.startsWith("urn:li:sponsoredAccount:")
    ? adAccountId
    : `urn:li:sponsoredAccount:${numericAdAccountId(adAccountId)}`;
}

async function restPost<T>(path: string, accessToken: string, body: unknown): Promise<{ data: T | null; id: string | null }> {
  try {
    const res = await fetch(`${REST_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const id = res.headers.get("x-restli-id") ?? res.headers.get("x-linkedin-id");
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[marketing/linkedin-ads] request failed: ${path} -> ${res.status} ${errBody}`);
      return { data: null, id: null };
    }
    const data = res.status === 204 ? ({} as T) : ((await res.json().catch(() => null)) as T | null);
    return { data, id };
  } catch (error) {
    console.error(`[marketing/linkedin-ads] request errored: ${path}`, error);
    return { data: null, id: null };
  }
}

/**
 * Full submit: creates an ads-only post -> Campaign Group -> Campaign ->
 * Creative, all PAUSED. Returns the platform IDs on success.
 */
export async function submitLinkedInCampaign(
  adAccountId: string,
  accessToken: string,
  organizationUrn: string,
  campaign: AdCampaign
): Promise<{ ok: true; platformIds: Record<string, string> } | { ok: false; error: string; platformIds: Record<string, string> }> {
  const account = accountUrn(adAccountId);
  const acctPath = `/adAccounts/${numericAdAccountId(adAccountId)}`;
  const platformIds: Record<string, string> = {};

  // Ads-only post (feedDistribution NONE keeps it off the organic feed) - the creative below references it.
  const postBody: Record<string, unknown> = {
    author: organizationUrn,
    commentary: campaign.creative.body,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "NONE", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED",
  };
  const postResult = await restPost<Record<string, never>>("/posts", accessToken, postBody);
  if (!postResult.id) {
    return { ok: false, error: "LinkedIn rejected the ad creative's underlying post", platformIds };
  }
  platformIds.postUrn = postResult.id;

  const groupBody = {
    account,
    name: `${campaign.name} - Campaign Group`,
    status: "PAUSED",
    runSchedule: { start: new Date(campaign.schedule.startDate).getTime() },
  };
  const groupResult = await restPost<Record<string, never>>(`${acctPath}/adCampaignGroups`, accessToken, groupBody);
  if (!groupResult.id) {
    return { ok: false, error: "LinkedIn rejected the campaign group", platformIds };
  }
  platformIds.campaignGroupId = groupResult.id;

  const locations = campaign.targeting.locations.filter((l) => l.startsWith("urn:li:geo:"));
  const targetingCriteria = {
    include: {
      and: [{ or: { "urn:li:adTargetingFacet:locations": locations.length ? locations : [WORLDWIDE_GEO_URN] } }],
    },
  };

  const dailyBudgetAmount =
    campaign.budget.type === "daily" ? campaign.budget.amount : campaign.budget.amount / 30;

  const campaignBody: Record<string, unknown> = {
    account,
    campaignGroup: groupResult.id,
    name: campaign.name,
    type: "SPONSORED_UPDATES",
    objectiveType: OBJECTIVE_MAP[campaign.objective],
    costType: "CPM",
    dailyBudget: { amount: dailyBudgetAmount.toFixed(2), currencyCode: campaign.budget.currency || "USD" },
    unitCost: { amount: "2.00", currencyCode: campaign.budget.currency || "USD" },
    targetingCriteria,
    locale: { country: "US", language: "en" },
    runSchedule: {
      start: new Date(campaign.schedule.startDate).getTime(),
      ...(campaign.schedule.endDate ? { end: new Date(campaign.schedule.endDate).getTime() } : {}),
    },
    status: "PAUSED",
  };
  const campaignResult = await restPost<Record<string, never>>(`${acctPath}/adCampaigns`, accessToken, campaignBody);
  if (!campaignResult.id) {
    return { ok: false, error: "LinkedIn rejected the campaign (check Marketing Developer Platform access is approved)", platformIds };
  }
  platformIds.campaignId = campaignResult.id;

  const creativeBody = {
    campaign: campaignResult.id,
    content: { reference: postResult.id },
    status: "PAUSED",
  };
  const creativeResult = await restPost<Record<string, never>>(`${acctPath}/creatives`, accessToken, creativeBody);
  if (!creativeResult.id) {
    return { ok: false, error: "LinkedIn rejected the ad creative", platformIds };
  }
  platformIds.creativeId = creativeResult.id;

  return { ok: true, platformIds };
}

export async function setLinkedInCampaignStatus(
  adAccountId: string,
  accessToken: string,
  platformIds: Record<string, string>,
  status: "ACTIVE" | "PAUSED"
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!platformIds.campaignId) return { ok: false, error: "No LinkedIn campaign to update" };
  const acctPath = `/adAccounts/${numericAdAccountId(adAccountId)}`;

  try {
    const res = await fetch(`${REST_BASE}${acctPath}/adCampaigns/${platformIds.campaignId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
        "X-RestLi-Method": "PARTIAL_UPDATE",
      },
      body: JSON.stringify({ patch: { $set: { status } } }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[marketing/linkedin-ads] status update failed", res.status, body);
      return { ok: false, error: "LinkedIn rejected the status change" };
    }
    return { ok: true };
  } catch (error) {
    console.error("[marketing/linkedin-ads] status update errored", error);
    return { ok: false, error: "LinkedIn request failed" };
  }
}

export async function getLinkedInCampaignInsights(
  adAccountId: string,
  campaignId: string,
  accessToken: string
): Promise<Record<string, number> | null> {
  const numericId = numericAdAccountId(adAccountId);
  const data = await restFetch<{
    elements?: Array<{ impressions?: number; clicks?: number; costInUsd?: string }>;
  }>(
    `/adAnalytics?q=analytics&campaigns=List(urn%3Ali%3AsponsoredCampaign%3A${campaignId})&accounts=List(urn%3Ali%3AsponsoredAccount%3A${numericId})&dateRange=(start:(year:2020,month:1,day:1))&fields=impressions,clicks,costInUsd`,
    accessToken
  );
  const row = data?.elements?.[0];
  if (!row) return null;
  return {
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
    spend: Number(row.costInUsd ?? 0),
  };
}
