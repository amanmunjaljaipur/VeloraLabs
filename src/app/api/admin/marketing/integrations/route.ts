import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { listPublicAccounts } from "@/lib/marketing/accounts-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Deprecated: kept only so nothing 404s if it was cached client-side.
 * The Marketing Board UI now calls /api/admin/marketing/accounts, which
 * reflects the direct-integration accounts store (no vendor in between).
 */
export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const accounts = await listPublicAccounts(tenantId);
  return NextResponse.json({ configured: true, integrations: accounts });
}
