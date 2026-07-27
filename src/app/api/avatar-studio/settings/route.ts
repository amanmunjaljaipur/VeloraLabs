import { auth } from "@/auth";
import { getPublicUserSettings, updateUserSettings } from "@/lib/avatar-studio/user-settings-store";
import { getPublicFreemiumPlan } from "@/lib/avatar-studio/freemium";
import { isGoogleDriveConfigured } from "@/lib/avatar-studio/google-drive-client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getPublicUserSettings(session.user.email);
  return NextResponse.json({
    settings,
    freemium: getPublicFreemiumPlan(),
    drivePlatformConfigured: isGoogleDriveConfigured(),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const voiceMode = body.voiceMode === "custom_url" ? "custom_url" : body.voiceMode === "free" ? "free" : undefined;
  const avatarMode = body.avatarMode === "custom_url" ? "custom_url" : body.avatarMode === "free" ? "free" : undefined;
  const stitchMode = body.stitchMode === "custom_url" ? "custom_url" : body.stitchMode === "free_skip" ? "free_skip" : undefined;

  const voiceEndpointUrl =
    body.voiceEndpointUrl === null || body.voiceEndpointUrl === ""
      ? null
      : typeof body.voiceEndpointUrl === "string"
        ? body.voiceEndpointUrl.trim()
        : undefined;
  const avatarEndpointUrl =
    body.avatarEndpointUrl === null || body.avatarEndpointUrl === ""
      ? null
      : typeof body.avatarEndpointUrl === "string"
        ? body.avatarEndpointUrl.trim()
        : undefined;
  const frameExtractEndpointUrl =
    body.frameExtractEndpointUrl === null || body.frameExtractEndpointUrl === ""
      ? null
      : typeof body.frameExtractEndpointUrl === "string"
        ? body.frameExtractEndpointUrl.trim()
        : undefined;
  const stitchEndpointUrl =
    body.stitchEndpointUrl === null || body.stitchEndpointUrl === ""
      ? null
      : typeof body.stitchEndpointUrl === "string"
        ? body.stitchEndpointUrl.trim()
        : undefined;
  const presenterPortraitUrl =
    body.presenterPortraitUrl === null || body.presenterPortraitUrl === ""
      ? null
      : typeof body.presenterPortraitUrl === "string"
        ? body.presenterPortraitUrl.trim()
        : undefined;
  const presenterStylePrompt =
    body.presenterStylePrompt === null || body.presenterStylePrompt === ""
      ? null
      : typeof body.presenterStylePrompt === "string"
        ? body.presenterStylePrompt.trim().slice(0, 500)
        : undefined;

  for (const [label, url] of [
    ["voiceEndpointUrl", voiceEndpointUrl],
    ["avatarEndpointUrl", avatarEndpointUrl],
    ["frameExtractEndpointUrl", frameExtractEndpointUrl],
    ["stitchEndpointUrl", stitchEndpointUrl],
    ["presenterPortraitUrl", presenterPortraitUrl],
  ] as const) {
    if (url !== undefined && url !== null && !isHttpUrl(url)) {
      return NextResponse.json({ error: `${label} must be a valid http(s) URL` }, { status: 400 });
    }
  }

  if (voiceMode === "custom_url" && !voiceEndpointUrl && voiceEndpointUrl !== undefined) {
    // allow saving mode with empty and fail at runtime with free fallback
  }

  await updateUserSettings(session.user.email, {
    ...(voiceMode ? { voiceMode } : {}),
    ...(avatarMode ? { avatarMode } : {}),
    ...(stitchMode ? { stitchMode } : {}),
    ...(voiceEndpointUrl !== undefined ? { voiceEndpointUrl } : {}),
    ...(avatarEndpointUrl !== undefined ? { avatarEndpointUrl } : {}),
    ...(frameExtractEndpointUrl !== undefined ? { frameExtractEndpointUrl } : {}),
    ...(stitchEndpointUrl !== undefined ? { stitchEndpointUrl } : {}),
    ...(presenterPortraitUrl !== undefined ? { presenterPortraitUrl } : {}),
    ...(presenterStylePrompt !== undefined ? { presenterStylePrompt } : {}),
  });

  const settings = await getPublicUserSettings(session.user.email);
  return NextResponse.json({ settings, freemium: getPublicFreemiumPlan() });
}
