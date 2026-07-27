import { auth } from "@/auth";
import { getDriveConnection } from "@/lib/avatar-studio/storage-connections-store";
import { getGoogleDriveConfigStatus, isGoogleDriveConfigured } from "@/lib/avatar-studio/google-drive-client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connection = await getDriveConnection(session.user.email);
  const config = getGoogleDriveConfigStatus();
  const origin = req.nextUrl.origin;

  return NextResponse.json({
    configured: isGoogleDriveConfigured(),
    connected: Boolean(connection),
    connectedAt: connection?.connectedAt ?? null,
    /** Same keys as Google login when dedicated Drive keys are unset */
    credentialSource: config.credentialSource,
    missingEnv: config.missingEnv,
    /** Full redirect URI to paste in Google Cloud Console (this host) */
    redirectUri: `${origin}${config.redirectUriPath}`,
    redirectUriPath: config.redirectUriPath,
    driveScope: config.driveScope,
    connectUrl: "/api/avatar-studio/storage/drive/connect",
    setupSteps: config.configured
      ? [
          "Credentials found — use Connect Google Drive.",
          `Confirm this redirect URI is on your OAuth client: ${origin}${config.redirectUriPath}`,
          "Confirm Google Drive API is enabled on the same Google Cloud project.",
          "Confirm OAuth consent includes drive.file (or app is in Testing with your email as test user).",
        ]
      : [
          "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local (same values as Google login / Vercel).",
          "Restart next dev after saving .env.local.",
          `In Google Cloud → Credentials → your Web client → Authorized redirect URIs, add: ${origin}${config.redirectUriPath}`,
          "Enable Google Drive API for that project.",
          "OAuth consent screen: add scope drive.file (or keep Testing + add yourself as test user).",
        ],
  });
}
