import { GRAPH_BASE, graphFetch } from "@/lib/marketing/meta-client";
import type { AdCampaign } from "@/lib/marketing/ad-campaigns-store";

/**
 * Meta Marketing API client for paid campaigns on Facebook/Instagram (they
 * share one ad account). Object hierarchy is strict and must be created in
 * order: Campaign -> Ad Set -> Ad Creative -> Ad. Every object is created
 * with status "PAUSED" - activation is a separate, explicit call
 * (setMetaCampaignStatus), matching this whole feature's "never auto-spend"
 * rule.
 *
 * Known simplifications (documented, not hidden):
 * - "leads" objective uses LEAD_GENERATION optimization but does not create
 *   an Instant Forms lead form - that still has to be built once in Meta
 *   Ads Manager and referenced manually; without one this objective will
 *   fail at the ad set step with a clear error surfaced to the caller.
 * - "conversions" uses LANDING_PAGE_VIEWS rather than OFFSITE_CONVERSIONS,
 *   since true conversion optimization needs a Meta Pixel + configured
 *   custom conversion event on the destination site, which is outside this
 *   codebase. Swap the optimization_goal below once that exists.
 * - Targeting is geo (country codes) + age + gender only - interest/
 *   audience targeting needs Meta's Targeting Search API to resolve
 *   free-text interests to IDs, not implemented here.
 */

const FETCH_TIMEOUT_MS = 20_000;

function actId(adAccountId: string): string {
  return adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
}

const OBJECTIVE_MAP: Record<AdCampaign["objective"], string> = {
  awareness: "OUTCOME_AWARENESS",
  traffic: "OUTCOME_TRAFFIC",
  engagement: "OUTCOME_ENGAGEMENT",
  leads: "OUTCOME_LEADS",
  conversions: "OUTCOME_SALES",
};

const OPTIMIZATION_GOAL: Record<AdCampaign["objective"], string> = {
  awareness: "REACH",
  traffic: "LINK_CLICKS",
  engagement: "POST_ENGAGEMENT",
  leads: "LEAD_GENERATION",
  conversions: "LANDING_PAGE_VIEWS",
};

const BILLING_EVENT: Record<AdCampaign["objective"], string> = {
  awareness: "IMPRESSIONS",
  traffic: "LINK_CLICKS",
  engagement: "IMPRESSIONS",
  leads: "IMPRESSIONS",
  conversions: "IMPRESSIONS",
};

/** Uploads an image to the ad account's image library, returning the hash creatives reference. */
async function uploadAdImage(
  adAccountId: string,
  accessToken: string,
  imageUrl: string
): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!imgRes.ok) return { ok: false, error: `Could not fetch creative image (${imgRes.status})` };
    const bytes = Buffer.from(await imgRes.arrayBuffer());

    const form = new FormData();
    form.append("access_token", accessToken);
    form.append("filename", new Blob([bytes]), "creative.jpg");

    const res = await fetch(`${GRAPH_BASE}/${actId(adAccountId)}/adimages`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const data = (await res.json().catch(() => null)) as {
      images?: Record<string, { hash?: string }>;
      error?: { message?: string };
    } | null;
    const hash = data?.images?.["creative.jpg"]?.hash;
    if (!res.ok || !hash) {
      console.error("[marketing/meta-ads] image upload failed", res.status, data);
      return { ok: false, error: data?.error?.message ?? "Meta rejected the creative image" };
    }
    return { ok: true, hash };
  } catch (error) {
    console.error("[marketing/meta-ads] image upload errored", error);
    return { ok: false, error: "Creative image upload to Meta failed" };
  }
}

/**
 * Full submit: creates Campaign -> Ad Set -> Ad Creative -> Ad, all PAUSED.
 * Returns the four platform IDs on success, or the first error hit - each
 * step logs which object type failed so a partial creation (e.g. campaign
 * exists but ad set failed) is diagnosable from platformIds/error alone.
 */
export async function submitMetaCampaign(
  adAccountId: string,
  accessToken: string,
  pageId: string,
  campaign: AdCampaign
): Promise<{ ok: true; platformIds: Record<string, string> } | { ok: false; error: string; platformIds: Record<string, string> }> {
  const account = actId(adAccountId);
  const platformIds: Record<string, string> = {};

  const campaignRes = await graphFetch<{ id?: string; error?: { message: string } }>(
    `/${account}/campaigns`,
    {
      name: campaign.name,
      objective: OBJECTIVE_MAP[campaign.objective],
      status: "PAUSED",
      special_ad_categories: "[]",
      access_token: accessToken,
    },
    { method: "POST" }
  );
  if (!campaignRes?.id) {
    return { ok: false, error: campaignRes?.error?.message ?? "Meta rejected the campaign", platformIds };
  }
  platformIds.campaignId = campaignRes.id;

  const genderMap: Record<AdCampaign["targeting"]["genders"], number[] | undefined> = {
    all: undefined,
    male: [1],
    female: [2],
  };
  const targeting: Record<string, unknown> = {
    geo_locations: { countries: campaign.targeting.locations.length ? campaign.targeting.locations : ["US"] },
    age_min: campaign.targeting.ageMin,
    age_max: campaign.targeting.ageMax,
  };
  const genders = genderMap[campaign.targeting.genders];
  if (genders) targeting.genders = genders;

  const budgetField: Record<string, string> =
    campaign.budget.type === "daily"
      ? { daily_budget: String(Math.round(campaign.budget.amount * 100)) }
      : { lifetime_budget: String(Math.round(campaign.budget.amount * 100)) };

  const adSetRes = await graphFetch<{ id?: string; error?: { message: string } }>(
    `/${account}/adsets`,
    {
      name: `${campaign.name} - Ad Set`,
      campaign_id: campaignRes.id,
      optimization_goal: OPTIMIZATION_GOAL[campaign.objective],
      billing_event: BILLING_EVENT[campaign.objective],
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      targeting: JSON.stringify(targeting),
      status: "PAUSED",
      start_time: new Date(campaign.schedule.startDate).toISOString(),
      ...(campaign.schedule.endDate ? { end_time: new Date(campaign.schedule.endDate).toISOString() } : {}),
      ...budgetField,
      access_token: accessToken,
    },
    { method: "POST" }
  );
  if (!adSetRes?.id) {
    return {
      ok: false,
      error: adSetRes?.error?.message ?? "Meta rejected the ad set (leads objective needs a Lead Form built in Ads Manager first)",
      platformIds,
    };
  }
  platformIds.adSetId = adSetRes.id;

  let imageHash: string | null = null;
  if (campaign.creative.imageUrl) {
    const uploaded = await uploadAdImage(adAccountId, accessToken, campaign.creative.imageUrl);
    if (uploaded.ok) imageHash = uploaded.hash;
    else console.error("[marketing/meta-ads] creative image skipped:", uploaded.error);
  }

  const linkData: Record<string, unknown> = {
    message: campaign.creative.body,
    link: campaign.creative.linkUrl || "https://www.verlinlabs.com",
    name: campaign.creative.headline || undefined,
    call_to_action: { type: campaign.creative.callToAction || "LEARN_MORE" },
    ...(imageHash ? { image_hash: imageHash } : {}),
  };

  const creativeRes = await graphFetch<{ id?: string; error?: { message: string } }>(
    `/${account}/adcreatives`,
    {
      name: `${campaign.name} - Creative`,
      object_story_spec: JSON.stringify({ page_id: pageId, link_data: linkData }),
      access_token: accessToken,
    },
    { method: "POST" }
  );
  if (!creativeRes?.id) {
    return { ok: false, error: creativeRes?.error?.message ?? "Meta rejected the ad creative", platformIds };
  }
  platformIds.creativeId = creativeRes.id;

  const adRes = await graphFetch<{ id?: string; error?: { message: string } }>(
    `/${account}/ads`,
    {
      name: `${campaign.name} - Ad`,
      adset_id: adSetRes.id,
      creative: JSON.stringify({ creative_id: creativeRes.id }),
      status: "PAUSED",
      access_token: accessToken,
    },
    { method: "POST" }
  );
  if (!adRes?.id) {
    return { ok: false, error: adRes?.error?.message ?? "Meta rejected the ad", platformIds };
  }
  platformIds.adId = adRes.id;

  return { ok: true, platformIds };
}

/** Flips the top-level Campaign's status - Meta cascades ACTIVE down to its (already PAUSED-created) ad sets/ads only if they're individually set active too, so this also flips the ad set and ad. */
export async function setMetaCampaignStatus(
  adAccountId: string,
  accessToken: string,
  platformIds: Record<string, string>,
  status: "ACTIVE" | "PAUSED"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ids = [platformIds.campaignId, platformIds.adSetId, platformIds.adId].filter(Boolean) as string[];
  if (ids.length === 0) return { ok: false, error: "No Meta objects to update" };

  for (const id of ids) {
    const res = await graphFetch<{ success?: boolean; error?: { message: string } }>(
      `/${id}`,
      { status, access_token: accessToken },
      { method: "POST" }
    );
    if (!res || res.error) {
      return { ok: false, error: res?.error?.message ?? `Meta rejected the status change for ${id}` };
    }
  }
  return { ok: true };
}

export async function getMetaCampaignInsights(
  campaignId: string,
  accessToken: string
): Promise<Record<string, number> | null> {
  const data = await graphFetch<{ data?: Array<Record<string, string>> }>(`/${campaignId}/insights`, {
    fields: "impressions,clicks,spend,reach,cpc,ctr",
    access_token: accessToken,
  });
  const row = data?.data?.[0];
  if (!row) return null;
  return {
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    spend: Number(row.spend ?? 0),
    reach: Number(row.reach ?? 0),
  };
}
