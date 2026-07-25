import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { getAdCampaign, updateAdCampaign } from "@/lib/marketing/ad-campaigns-store";
import { getAdAccount } from "@/lib/marketing/ad-accounts-store";
import { listConnectedAccounts } from "@/lib/marketing/accounts-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { setMetaCampaignStatus } from "@/lib/marketing/meta-ads-client";
import { setLinkedInCampaignStatus } from "@/lib/marketing/linkedin-ads-client";
import { setXCampaignStatus } from "@/lib/marketing/x-ads-client";
import { logError } from "@/lib/diagnostics/log-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Stops spend on an active (or previously-submitted) campaign. Super admin only, same gate as activate. */
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const isSuperAdmin = isHardcodedSuperAdmin(session.user?.email) || isSuperAdminRole(session.user?.role);
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const tenantId = await resolveTenantId(session.user?.email);

  const campaign = await getAdCampaign(id, tenantId);
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (Object.keys(campaign.platformIds).length === 0) {
    return NextResponse.json({ error: "This campaign was never submitted to the platform" }, { status: 409 });
  }

  const adAccount = await getAdAccount(tenantId, campaign.platform);
  if (!adAccount?.adAccountId) {
    return NextResponse.json({ error: "No ad account configured" }, { status: 400 });
  }

  let result: { ok: true } | { ok: false; error: string };
  if (campaign.platform === "meta") {
    if (!adAccount.metaUserAccessToken) {
      return NextResponse.json({ error: "No Meta access token on file" }, { status: 400 });
    }
    result = await setMetaCampaignStatus(adAccount.adAccountId, adAccount.metaUserAccessToken, campaign.platformIds, "PAUSED");
  } else if (campaign.platform === "linkedin") {
    const accounts = await listConnectedAccounts(tenantId);
    const org = accounts.find((a) => a.platform === "linkedin");
    if (!org) return NextResponse.json({ error: "No connected LinkedIn Company Page found" }, { status: 400 });
    result = await setLinkedInCampaignStatus(adAccount.adAccountId, org.accessToken, campaign.platformIds, "PAUSED");
  } else {
    result = await setXCampaignStatus(adAccount.adAccountId, campaign.platformIds, "PAUSED");
  }

  if (!result.ok) {
    void logError("marketing/campaign-pause", result.error, { campaignId: id, platform: campaign.platform });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const updated = await updateAdCampaign(id, tenantId, { status: "paused", error: null });
  return NextResponse.json({ campaign: updated });
}
