import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { listPublicAccounts } from "@/lib/marketing/accounts-store";
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

  const accounts = await listPublicAccounts();
  return NextResponse.json({ configured: true, integrations: accounts });
}
