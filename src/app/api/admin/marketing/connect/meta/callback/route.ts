import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { discoverPages, exchangeCodeForUserToken, getLongLivedUserToken } from "@/lib/marketing/meta-client";
import { upsertConnectedAccount } from "@/lib/marketing/accounts-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { verifyAndConsumeOAuthState } from "@/lib/marketing/oauth-state";
import { logError } from "@/lib/diagnostics/log-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const LOG_PAGE = "marketing/meta-oauth-connect";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (reason: string, meta?: Record<string, unknown>) => {
    // Every failure here is exactly the kind of thing that used to require a
    // throwaway code change + redeploy to diagnose - now it's just a log entry.
    void logError(LOG_PAGE, reason, meta);
    return NextResponse.redirect(new URL(`/admin/marketing?error=${reason}`, origin));
  };

  const session = await auth();
  const isSuperAdmin =
    Boolean(session?.user?.email) &&
    (isHardcodedSuperAdmin(session!.user!.email) || isSuperAdminRole(session!.user!.role));
  if (!isSuperAdmin) return fail("forbidden");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");
  const oauthErrorDescription = req.nextUrl.searchParams.get("error_description");

  if (oauthError) return fail("meta_denied", { oauthError, oauthErrorDescription });
  if (!code) return fail("meta_no_code");

  const stateOk = await verifyAndConsumeOAuthState("meta", state);
  if (!stateOk) return fail("state_mismatch");

  const redirectUri = new URL("/api/admin/marketing/connect/meta/callback", origin).toString();

  const shortLived = await exchangeCodeForUserToken(code, redirectUri);
  if (!shortLived) return fail("meta_token_exchange_failed");

  const longLivedToken = await getLongLivedUserToken(shortLived.accessToken);
  if (!longLivedToken) return fail("meta_long_lived_exchange_failed");

  const pages = await discoverPages(longLivedToken);
  if (pages.length === 0) {
    return fail("meta_no_pages_found", {
      hint: "Graph API /me/accounts returned zero pages for this token - usually means the connecting Business Portfolio hasn't added this app under Business Settings > Apps, not a code bug.",
    });
  }

  const connectedBy = session!.user!.email as string;
  const tenantId = await resolveTenantId(connectedBy);

  for (const page of pages) {
    // Page access tokens derived from a long-lived user token effectively do not expire.
    await upsertConnectedAccount({
      tenantId,
      platform: "facebook",
      externalId: page.pageId,
      name: page.pageName,
      picture: page.pagePicture,
      accessToken: page.pageAccessToken,
      expiresAt: null,
      connectedBy,
    });

    if (page.instagramBusinessAccountId) {
      await upsertConnectedAccount({
        tenantId,
        platform: "instagram",
        externalId: page.instagramBusinessAccountId,
        name: page.instagramUsername ? `@${page.instagramUsername}` : `${page.pageName} (Instagram)`,
        picture: page.pagePicture,
        // Instagram posting via Graph API uses the same Page access token as the linked Page.
        accessToken: page.pageAccessToken,
        expiresAt: null,
        connectedBy,
      });
    }
  }

  return NextResponse.redirect(new URL("/admin/marketing?connected=meta", origin));
}
