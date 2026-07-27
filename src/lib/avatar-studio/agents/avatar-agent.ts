import { getModel } from "@/lib/avatar-studio/model-catalog";
import type { GenerationResult } from "@/lib/avatar-studio/agents/types";
import { getUserSettings } from "@/lib/avatar-studio/user-settings-store";
import { buildPresenterPackage } from "@/lib/avatar-studio/providers/presenter";

/**
 * Avatar Agent: freemium by default.
 *
 * Resolution order:
 * 1. User Setup → custom avatar/lip-sync URL
 * 2. Model catalog env var (platform GPU host)
 * 3. Free Presenter mode (portrait + audio, playable in-app)
 *
 * Custom endpoint contract:
 *   POST {url}
 *   body: { audioUrl, avatarProfileId?, qualityTier, referenceImageUrl? }
 *   response: { videoUrl, durationSeconds } | { error }
 */

async function callCustomEndpoint(
  endpointUrl: string,
  label: string,
  audioUrl: string,
  qualityTier: string,
  avatarProfileId: string | null,
  referenceImageUrl?: string | null
): Promise<GenerationResult> {
  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audioUrl,
        avatarProfileId,
        qualityTier,
        referenceImageUrl: referenceImageUrl ?? undefined,
      }),
      signal: AbortSignal.timeout(180_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.videoUrl) {
      return {
        ok: false,
        storageRef: null,
        durationSeconds: null,
        error: data?.error ?? `${label} endpoint rejected the request`,
      };
    }
    return {
      ok: true,
      storageRef: { provider: "blob", url: data.videoUrl },
      durationSeconds: data.durationSeconds ?? null,
      error: null,
      outputKind: "video",
    };
  } catch (error) {
    console.error("[avatar-studio/avatar-agent] custom endpoint failed", error);
    return {
      ok: false,
      storageRef: null,
      durationSeconds: null,
      error: `Could not reach the ${label} endpoint`,
    };
  }
}

export async function generateAvatarVideo(
  avatarModelId: string,
  audioUrl: string,
  qualityTier: string,
  avatarProfileId: string | null,
  referenceImageUrl?: string | null,
  userEmail?: string,
  durationSecondsHint?: number | null,
  opts?: {
    scriptPreview?: string;
    /** Force presenter portrait (e.g. selected face training sample). */
    portraitUrlOverride?: string | null;
    onProgress?: (percent: number, label: string) => void | Promise<void>;
  }
): Promise<GenerationResult> {
  const model = await getModel(avatarModelId);
  if (!model || model.kind !== "avatar") {
    return { ok: false, storageRef: null, durationSeconds: null, error: "Unknown avatar model" };
  }

  if (!audioUrl) {
    return { ok: false, storageRef: null, durationSeconds: null, error: "Missing audio URL for avatar generation" };
  }

  // 1) Per-user custom URL
  if (userEmail) {
    const settings = await getUserSettings(userEmail);
    if (settings.avatarMode === "custom_url" && settings.avatarEndpointUrl) {
      const custom = await callCustomEndpoint(
        settings.avatarEndpointUrl,
        "Your custom avatar",
        audioUrl,
        qualityTier,
        avatarProfileId,
        referenceImageUrl
      );
      if (custom.ok) return custom;
      console.warn("[avatar-studio/avatar-agent] custom avatar failed, falling back to free presenter:", custom.error);
    }
  }

  // 2) Platform env endpoint
  const endpointUrl = process.env[model.endpointEnvVar];
  if (endpointUrl) {
    return callCustomEndpoint(endpointUrl, model.label, audioUrl, qualityTier, avatarProfileId, referenceImageUrl);
  }

  // 3) Free Presenter mode
  if (!userEmail) {
    return {
      ok: false,
      storageRef: null,
      durationSeconds: null,
      error: `${model.label} has no endpoint and free Presenter needs a user context`,
    };
  }

  const settings = await getUserSettings(userEmail);
  const audioRef = { provider: "blob" as const, url: audioUrl };
  const portraitUrl =
    (opts?.portraitUrlOverride && opts.portraitUrlOverride.trim()) ||
    settings.presenterPortraitUrl ||
    null;

  const built = await buildPresenterPackage({
    email: userEmail,
    audioRef,
    durationSeconds: durationSecondsHint ?? 30,
    stylePrompt: settings.presenterStylePrompt,
    portraitUrl,
    scriptPreview: opts?.scriptPreview,
    onProgress: opts?.onProgress,
  });

  if (!built.ok) {
    return { ok: false, storageRef: null, durationSeconds: null, error: built.error };
  }

  const pkg = built.package;
  const isAnimatedVideo = Boolean(pkg.video);
  return {
    ok: true,
    storageRef: pkg.primary,
    durationSeconds: pkg.durationSeconds,
    error: null,
    // Prefer "video" when we produced a real MP4 so UI uses <video> not still player
    outputKind: isAnimatedVideo ? "video" : "presenter",
    audioRef: pkg.audio,
    posterRef: pkg.poster,
  };
}
