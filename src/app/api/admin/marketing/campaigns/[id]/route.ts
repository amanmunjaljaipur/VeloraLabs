import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { deleteAdCampaign, getAdCampaign } from "@/lib/marketing/ad-campaigns-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Deletes a campaign - draft/paused only; active campaigns must be paused first so nothing keeps spending unattended. Super admin only. */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const isSuperAdmin = isHardcodedSuperAdmin(session.user?.email) || isSuperAdminRole(session.user?.role);
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const tenantId = await resolveTenantId(session.user?.email);

  const campaign = await getAdCampaign(id, tenantId);
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status === "active") {
    return NextResponse.json({ error: "Pause the campaign before deleting it" }, { status: 409 });
  }

  await deleteAdCampaign(id, tenantId);
  return NextResponse.json({ ok: true });
}
