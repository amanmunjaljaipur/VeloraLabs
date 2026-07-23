import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { buildLinkedInOrgAuthUrl, isLinkedInOrgConfigured } from "@/lib/marketing/linkedin-client";
import { issueOAuthState } from "@/lib/marketing/oauth-state";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  const isSuperAdmin =
    Boolean(session?.user?.email) &&
    (isHardcodedSuperAdmin(session!.user!.email) || isSuperAdminRole(session!.user!.role));
  if (!isSuperAdmin) {
    return NextResponse.redirect(new URL("/admin/marketing?error=forbidden", req.nextUrl.origin));
  }

  if (!isLinkedInOrgConfigured()) {
    return NextResponse.redirect(new URL("/admin/marketing?error=linkedin_not_configured", req.nextUrl.origin));
  }

  const state = await issueOAuthState("linkedin");
  const redirectUri = new URL("/api/admin/marketing/connect/linkedin/callback", req.nextUrl.origin).toString();
  return NextResponse.redirect(buildLinkedInOrgAuthUrl(state, redirectUri));
}
