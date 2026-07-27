import { auth } from "@/auth";
import { isGoogleDriveConfigured, buildGoogleDriveAuthUrl } from "@/lib/avatar-studio/google-drive-client";
import { issueOAuthState } from "@/lib/marketing/oauth-state";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Starts the optional Google Drive connect flow for any logged-in user (not admin-only - this is a personal storage preference, not a platform-wide credential). */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login?callbackUrl=/avatar-studio?tab=train", req.nextUrl.origin));
  }

  if (!isGoogleDriveConfigured()) {
    // Never start OAuth without real keys — return to Setup/Train with a clear error code
    const dest = new URL("/avatar-studio", req.nextUrl.origin);
    dest.searchParams.set("tab", "train");
    dest.searchParams.set("error", "drive_not_configured");
    return NextResponse.redirect(dest);
  }

  const state = await issueOAuthState("google_drive");
  const redirectUri = new URL("/api/avatar-studio/storage/drive/callback", req.nextUrl.origin).toString();
  return NextResponse.redirect(buildGoogleDriveAuthUrl(state, redirectUri));
}
