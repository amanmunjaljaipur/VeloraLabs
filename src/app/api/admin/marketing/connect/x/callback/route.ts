import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { discoverXAccount, exchangeCodeForToken } from "@/lib/marketing/x-client";
import { upsertConnectedAccount } from "@/lib/marketing/accounts-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { consumePkceVerifier, verifyAndConsumeOAuthState } from "@/lib/marketing/oauth-state";
import { logError } from "@/lib/diagnostics/log-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (reason: string, meta?: Record<string, unknown>) => {
    void logError("marketing/x-oauth-connect", reason, meta);
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

  if (oauthError) return fail("x_denied");
  if (!code) return fail("x_no_code");

  const stateOk = await verifyAndConsumeOAuthState("x", state);
  if (!stateOk) return fail("state_mismatch");

  // PKCE: the verifier stashed by connect/x/route.ts must be replayed here so X can confirm
  // this callback belongs to the same browser that started the authorize request.
  const codeVerifier = await consumePkceVerifier("x");
  if (!codeVerifier) return fail("x_pkce_missing");

  const redirectUri = new URL("/api/admin/marketing/connect/x/callback", origin).toString();

  const token = await exchangeCodeForToken(code, redirectUri, codeVerifier);
  if (!token) return fail("x_token_exchange_failed");

  const account = await discoverXAccount(token.accessToken);
  if (!account) return fail("x_no_account_found");

  const connectedBy = session!.user!.email as string;
  const tenantId = await resolveTenantId(connectedBy);
  const expiresAt = new Date(Date.now() + token.expiresInSeconds * 1000).toISOString();

  await upsertConnectedAccount({
    tenantId,
    platform: "x",
    externalId: account.userId,
    name: `@${account.username}`,
    picture: account.picture,
    accessToken: token.accessToken,
    expiresAt,
    refreshToken: token.refreshToken,
    connectedBy,
  });

  return NextResponse.redirect(new URL("/admin/marketing?connected=x", origin));
}
