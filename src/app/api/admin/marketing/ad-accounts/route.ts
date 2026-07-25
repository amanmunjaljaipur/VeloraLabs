import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { listAdAccounts, setAdAccountId, toPublicAdAccount, type AdsPlatform } from "@/lib/marketing/ad-accounts-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_PLATFORMS: AdsPlatform[] = ["meta", "linkedin", "x"];

/** Ad account IDs configured for paid campaigns - safe to show admin+super_admin, never includes tokens. */
export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const configs = await listAdAccounts(tenantId);
  return NextResponse.json({ adAccounts: configs.map(toPublicAdAccount) });
}

/** Set an ad account ID for a platform - super_admin only, since campaigns built against it can spend real money. */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const isSuperAdmin = isHardcodedSuperAdmin(session.user?.email) || isSuperAdminRole(session.user?.role);
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const platform = body?.platform as string | undefined;
  const adAccountId = typeof body?.adAccountId === "string" ? body.adAccountId.trim() : "";

  if (!platform || !VALID_PLATFORMS.includes(platform as AdsPlatform)) {
    return NextResponse.json({ error: "platform must be meta, linkedin, or x" }, { status: 400 });
  }
  if (!adAccountId || adAccountId.length > 200) {
    return NextResponse.json({ error: "Enter a valid ad account ID" }, { status: 400 });
  }

  const tenantId = await resolveTenantId(session.user?.email);
  const saved = await setAdAccountId(tenantId, platform as AdsPlatform, adAccountId, session.user?.email ?? "unknown");
  return NextResponse.json({ adAccount: toPublicAdAccount(saved) });
}
