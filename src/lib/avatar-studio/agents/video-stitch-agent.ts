import type { JobStorageRef } from "@/lib/avatar-studio/jobs-store";
import { getUserSettings } from "@/lib/avatar-studio/user-settings-store";

/**
 * Frame extraction + clip concatenation for long-form video chaining.
 * Plain ffmpeg — no GPU. Resolution order:
 * 1. Per-user Setup URLs
 * 2. Platform env VIDEO_* endpoints
 * 3. Free skip: single clip returns as-is; multi-clip presenter long-form
 *    is handled upstream by using free single-package path.
 */

async function postJson(
  endpointUrl: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.error ?? "Endpoint rejected the request" };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Could not reach the endpoint" };
  }
}

export async function extractLastFrame(
  videoUrl: string,
  userEmail?: string
): Promise<{ ok: true; ref: JobStorageRef } | { ok: false; error: string }> {
  let endpointUrl = process.env.VIDEO_FRAME_EXTRACT_ENDPOINT_URL ?? "";
  if (userEmail) {
    const settings = await getUserSettings(userEmail);
    if (settings.stitchMode === "custom_url" && settings.frameExtractEndpointUrl) {
      endpointUrl = settings.frameExtractEndpointUrl;
    }
  }

  if (!endpointUrl) {
    // Free path: no frame continuity — long-form free uses single presenter package instead.
    return {
      ok: false,
      error:
        "Frame extraction is not configured. Add a free/CPU ffmpeg URL in Setup → Generation, or use Free Presenter long-form (single narrated package).",
    };
  }

  const result = await postJson(endpointUrl, { videoUrl }, 60_000);
  if (!result.ok) return result;
  if (!result.data?.imageUrl) return { ok: false, error: "Frame extraction endpoint returned no imageUrl" };
  return { ok: true, ref: { provider: "blob", url: result.data.imageUrl } };
}

export async function stitchClips(
  videoUrls: string[],
  userEmail?: string
): Promise<{ ok: true; ref: JobStorageRef; durationSeconds: number } | { ok: false; error: string }> {
  if (videoUrls.length === 0) return { ok: false, error: "No clips to stitch" };
  if (videoUrls.length === 1) {
    return { ok: true, ref: { provider: "blob", url: videoUrls[0]! }, durationSeconds: 0 };
  }

  let endpointUrl = process.env.VIDEO_STITCH_ENDPOINT_URL ?? "";
  if (userEmail) {
    const settings = await getUserSettings(userEmail);
    if (settings.stitchMode === "custom_url" && settings.stitchEndpointUrl) {
      endpointUrl = settings.stitchEndpointUrl;
    }
  }

  if (!endpointUrl) {
    return {
      ok: false,
      error:
        "Clip stitching is not configured. Paste a VIDEO_STITCH endpoint in Setup, or keep Free Presenter mode (no multi-clip stitch needed).",
    };
  }

  const result = await postJson(endpointUrl, { videoUrls }, 240_000);
  if (!result.ok) return result;
  if (!result.data?.videoUrl) return { ok: false, error: "Stitch endpoint returned no videoUrl" };
  return {
    ok: true,
    ref: { provider: "blob", url: result.data.videoUrl },
    durationSeconds: result.data.durationSeconds ?? 0,
  };
}
