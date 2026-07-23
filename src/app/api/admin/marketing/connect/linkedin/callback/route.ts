import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { discoverOrganizations, exchangeCodeForToken } from "@/lib/marketing/linkedin-client";
import { upsertConnectedAccount } from "@/lib/marketing/accounts-store";
import { verifyAndConsumeOAuthState } from "@/lib/marketing/oauth-state";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/admin/marketing?error=${reason}`, origin));

  const session = await auth();
  const isSuperAdmin =
    Boolean(session?.user?.email) &&
    (isHardcodedSuperAdmin(session!.user!.email) || isSuperAdminRole(session!.user!.role));
  if (!isSuperAdmin) return fail("forbidden");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");

  if (oauthError) return fail("linkedin_denied");
  if (!code) return fail("linkedin_no_code");

  const stateOk = await verifyAndConsumeOAuthState("linkedin", state);
  if (!stateOk) return fail("state_mismatch");

  const redirectUri = new URL("/api/admin/marketing/connect/linkedin/callback", origin).toString();

  const token = await exchangeCodeForToken(code, redirectUri);
  if (!token) return fail("linkedin_token_exchange_failed");

  const orgs = await discoverOrganizations(token.accessToken);
  if (orgs.length === 0) return fail("linkedin_no_organizations_found");

  const connectedBy = session!.user!.email as string;
  const expiresAt = new Date(Date.now() + token.expiresInSeconds * 1000).toISOString();

  for (const org of orgs) {
    await upsertConnectedAccount({
      platform: "linkedin",
      externalId: org.organizationUrn,
      name: org.name,
      picture: org.picture,
      accessToken: token.accessToken,
      expiresAt,
      connectedBy,
    });
  }

  return NextResponse.redirect(new URL("/admin/marketing?connected=linkedin", origin));
}
