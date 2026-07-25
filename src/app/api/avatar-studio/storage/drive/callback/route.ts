import { auth } from "@/auth";
import { exchangeCodeForToken } from "@/lib/avatar-studio/google-drive-client";
import { upsertDriveConnection } from "@/lib/avatar-studio/storage-connections-store";
import { verifyAndConsumeOAuthState } from "@/lib/marketing/oauth-state";
import { logError } from "@/lib/diagnostics/log-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const LOG_PAGE = "avatar-studio/drive-oauth-connect";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (reason: string, meta?: Record<string, unknown>) => {
    void logError(LOG_PAGE, reason, meta);
    return NextResponse.redirect(new URL(`/avatar-studio?tab=settings&error=${reason}`, origin));
  };

  const session = await auth();
  if (!session?.user?.email) return fail("unauthorized");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");
  if (oauthError) return fail("drive_denied", { oauthError });
  if (!code) return fail("drive_no_code");

  const stateOk = await verifyAndConsumeOAuthState("google_drive", state);
  if (!stateOk) return fail("state_mismatch");

  const redirectUri = new URL("/api/avatar-studio/storage/drive/callback", origin).toString();
  const tokens = await exchangeCodeForToken(code, redirectUri);
  if (!tokens?.accessToken) return fail("drive_token_exchange_failed");
  if (!tokens.refreshToken) {
    // Happens if the user previously connected and granted offline access
    // already - Google only issues a refresh_token on the FIRST consent
    // unless prompt=consent forces re-issue (which buildGoogleDriveAuthUrl
    // already sets), so this should be rare. Fail clearly rather than
    // silently storing a connection that can't self-refresh.
    return fail("drive_no_refresh_token", { hint: "Revoke access at myaccount.google.com/permissions and reconnect." });
  }

  await upsertDriveConnection({
    email: session.user.email,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: new Date(Date.now() + tokens.expiresInSeconds * 1000).toISOString(),
  });

  return NextResponse.redirect(new URL("/avatar-studio?tab=settings&connected=drive", origin));
}
