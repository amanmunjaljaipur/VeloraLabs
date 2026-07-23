import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { buildMetaAuthUrl, isMetaConfigured } from "@/lib/marketing/meta-client";
import { issueOAuthState } from "@/lib/marketing/oauth-state";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Starts the Meta OAuth flow. Connecting a business account's credentials
 * is a higher-trust action than viewing or posting with them, so this step
 * is super-admin only - the same split used for Session Slots vs. Bookings.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  const isSuperAdmin =
    Boolean(session?.user?.email) &&
    (isHardcodedSuperAdmin(session!.user!.email) || isSuperAdminRole(session!.user!.role));
  if (!isSuperAdmin) {
    return NextResponse.redirect(new URL("/admin/marketing?error=forbidden", req.nextUrl.origin));
  }

  if (!isMetaConfigured()) {
    return NextResponse.redirect(new URL("/admin/marketing?error=meta_not_configured", req.nextUrl.origin));
  }

  const state = await issueOAuthState("meta");
  const redirectUri = new URL("/api/admin/marketing/connect/meta/callback", req.nextUrl.origin).toString();
  return NextResponse.redirect(buildMetaAuthUrl(state, redirectUri));
}
