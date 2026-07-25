import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { getAdCampaign, updateAdCampaign, type AdCampaign } from "@/lib/marketing/ad-campaigns-store";
import { getAdAccount } from "@/lib/marketing/ad-accounts-store";
import { listConnectedAccounts } from "@/lib/marketing/accounts-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { submitMetaCampaign, setMetaCampaignStatus } from "@/lib/marketing/meta-ads-client";
import { submitLinkedInCampaign, setLinkedInCampaignStatus } from "@/lib/marketing/linkedin-ads-client";
import { submitXCampaign, setXCampaignStatus } from "@/lib/marketing/x-ads-client";
import { logError } from "@/lib/diagnostics/log-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const LOG_PAGE = "marketing/campaign-activate";

/**
 * Submits the campaign to its platform's Ads API if that hasn't happened
 * yet (objects are created PAUSED), then flips it to ACTIVE - this is the
 * one call in the whole paid-campaigns feature that can start real spend,
 * so it requires an explicit super_admin click, every time. Recoverable: if
 * submission already succeeded in a prior attempt (platformIds populated)
 * but the activate step failed, this retries only the status flip rather
 * than re-creating duplicate platform objects.
 */
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const isSuperAdmin = isHardcodedSuperAdmin(session.user?.email) || isSuperAdminRole(session.user?.role);
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const tenantId = await resolveTenantId(session.user?.email);

  const campaign = await getAdCampaign(id, tenantId);
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status === "active") {
    return NextResponse.json({ error: "Already active" }, { status: 409 });
  }
  if (campaign.status === "completed") {
    return NextResponse.json({ error: "This campaign has already completed" }, { status: 409 });
  }

  const adAccount = await getAdAccount(tenantId, campaign.platform);
  if (!adAccount?.adAccountId) {
    return NextResponse.json(
      { error: `No ${campaign.platform} ad account ID configured - add one in the Campaigns settings panel first` },
      { status: 400 }
    );
  }

  const fail = async (error: string, meta?: Record<string, unknown>) => {
    void logError(LOG_PAGE, error, { campaignId: id, platform: campaign.platform, ...meta });
    await updateAdCampaign(id, tenantId, { status: "failed", error });
    return NextResponse.json({ error }, { status: 502 });
  };

  const alreadySubmitted = Object.keys(campaign.platformIds).length > 0;
  let platformIds = campaign.platformIds;

  if (!alreadySubmitted) {
    const submitted = await submitForPlatform(campaign, tenantId, adAccount.adAccountId, adAccount.metaUserAccessToken ?? null);
    if (!submitted.ok) {
      await updateAdCampaign(id, tenantId, { status: "failed", error: submitted.error, platformIds: submitted.platformIds });
      void logError(LOG_PAGE, submitted.error, { campaignId: id, platform: campaign.platform, stage: "submit" });
      return NextResponse.json({ error: submitted.error }, { status: 502 });
    }
    platformIds = submitted.platformIds;
    await updateAdCampaign(id, tenantId, { status: "paused", platformIds, error: null });
  }

  const activated = await activateForPlatform(campaign.platform, tenantId, adAccount.adAccountId, platformIds);
  if (!activated.ok) {
    return fail(activated.error, { stage: "activate" });
  }

  const updated = await updateAdCampaign(id, tenantId, {
    status: "active",
    platformIds,
    error: null,
    activatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ campaign: updated });
}

async function submitForPlatform(
  campaign: AdCampaign,
  tenantId: string,
  adAccountId: string,
  metaUserAccessToken: string | null
): Promise<{ ok: true; platformIds: Record<string, string> } | { ok: false; error: string; platformIds: Record<string, string> }> {
  if (campaign.platform === "meta") {
    if (!metaUserAccessToken) {
      return { ok: false, error: "No Meta access token on file - reconnect Meta (Connect button) so ads_management scope is granted", platformIds: {} };
    }
    const accounts = await listConnectedAccounts(tenantId);
    const page = accounts.find((a) => a.platform === "facebook");
    if (!page) {
      return { ok: false, error: "No connected Facebook Page found - connect one before submitting a Meta campaign", platformIds: {} };
    }
    return submitMetaCampaign(adAccountId, metaUserAccessToken, page.externalId, campaign);
  }

  if (campaign.platform === "linkedin") {
    const accounts = await listConnectedAccounts(tenantId);
    const org = accounts.find((a) => a.platform === "linkedin");
    if (!org) {
      return { ok: false, error: "No connected LinkedIn Company Page found - connect one before submitting a LinkedIn campaign", platformIds: {} };
    }
    return submitLinkedInCampaign(adAccountId, org.accessToken, org.externalId, campaign);
  }

  return submitXCampaign(adAccountId, campaign);
}

async function activateForPlatform(
  platform: AdCampaign["platform"],
  tenantId: string,
  adAccountId: string,
  platformIds: Record<string, string>
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (platform === "meta") {
    const adAccount = await getAdAccount(tenantId, "meta");
    if (!adAccount?.metaUserAccessToken) return { ok: false, error: "No Meta access token on file" };
    return setMetaCampaignStatus(adAccountId, adAccount.metaUserAccessToken, platformIds, "ACTIVE");
  }
  if (platform === "linkedin") {
    const accounts = await listConnectedAccounts(tenantId);
    const org = accounts.find((a) => a.platform === "linkedin");
    if (!org) return { ok: false, error: "No connected LinkedIn Company Page found" };
    return setLinkedInCampaignStatus(adAccountId, org.accessToken, platformIds, "ACTIVE");
  }
  return setXCampaignStatus(adAccountId, platformIds, "ACTIVE");
}
