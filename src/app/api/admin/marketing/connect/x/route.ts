import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { isSuperAdminRole } from "@/lib/session-access";
import { buildXAuthUrl, createPkcePair, isXConfigured } from "@/lib/marketing/x-client";
import { issueOAuthState, issuePkceVerifier } from "@/lib/marketing/oauth-state";
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

  if (!isXConfigured()) {
    return NextResponse.redirect(new URL("/admin/marketing?error=x_not_configured", req.nextUrl.origin));
  }

  const state = await issueOAuthState("x");
  const { verifier, challenge } = createPkcePair();
  await issuePkceVerifier("x", verifier);

  // Prefer AUTH_URL so callback matches the URI registered in the X developer
  // portal (www vs apex mismatches are a common prod connect failure).
  const publicOrigin = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || req.nextUrl.origin).replace(
    /\/$/,
    ""
  );
  const redirectUri = `${publicOrigin}/api/admin/marketing/connect/x/callback`;
  return NextResponse.redirect(buildXAuthUrl(state, redirectUri, challenge));
}
