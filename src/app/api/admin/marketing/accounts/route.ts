import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { disconnectAccount, listPublicAccounts } from "@/lib/marketing/accounts-store";
import { isMetaConfigured } from "@/lib/marketing/meta-client";
import { isLinkedInOrgConfigured } from "@/lib/marketing/linkedin-client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Connected accounts, safe to show admin+super_admin. Never includes tokens. */
export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const accounts = await listPublicAccounts();
  return NextResponse.json({
    accounts,
    metaConfigured: isMetaConfigured(),
    linkedinConfigured: isLinkedInOrgConfigured(),
  });
}

/** Disconnect an account: DELETE /api/admin/marketing/accounts?id=... - super_admin only, since it touches credentials. */
export async function DELETE(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const isSuperAdmin = isHardcodedSuperAdmin(session.user?.email) || isSuperAdminRole(session.user?.role);
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const removed = await disconnectAccount(id);
  if (!removed) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
