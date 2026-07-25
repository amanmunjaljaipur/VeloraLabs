import type { JobStorageRef } from "@/lib/avatar-studio/jobs-store";

/**
 * Frame extraction + clip concatenation for long-form video chaining
 * (last-frame-of-clip-N becomes first-frame-reference-of-clip-N+1, then all
 * clips get stitched into one file). Unlike Voice/Avatar generation, both
 * operations here are plain ffmpeg - no GPU/ML model involved - which makes
 * this the CHEAPEST part of the long-form pipeline to stand up for real:
 * any small CPU box or serverless function running ffmpeg (e.g.
 * fluent-ffmpeg) is enough, it does not need to sit on the same GPU host as
 * the avatar models. Still built as a dispatcher-with-stubbed-backend, same
 * pattern as voice-agent.ts/avatar-agent.ts, so it fails clearly rather
 * than pretending until that endpoint exists.
 *
 * Expected endpoint contracts (implement on any ffmpeg-capable host):
 *   POST {VIDEO_FRAME_EXTRACT_ENDPOINT_URL}
 *     body: { videoUrl: string }
 *     response: { imageUrl: string } | { error: string }
 *   POST {VIDEO_STITCH_ENDPOINT_URL}
 *     body: { videoUrls: string[] }               // in final playback order
 *     response: { videoUrl: string, durationSeconds: number } | { error: string }
 */

export async function extractLastFrame(
  videoUrl: string
): Promise<{ ok: true; ref: JobStorageRef } | { ok: false; error: string }> {
  const endpointUrl = process.env.VIDEO_FRAME_EXTRACT_ENDPOINT_URL;
  if (!endpointUrl) {
    return {
      ok: false,
      error: "Frame extraction has no endpoint configured yet (set VIDEO_FRAME_EXTRACT_ENDPOINT_URL) - this is a plain ffmpeg operation, no GPU required",
    };
  }

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl }),
      signal: AbortSignal.timeout(60_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.imageUrl) {
      return { ok: false, error: data?.error ?? "Frame extraction endpoint rejected the request" };
    }
    return { ok: true, ref: { provider: "blob", url: data.imageUrl } };
  } catch (error) {
    console.error("[avatar-studio/video-stitch-agent] extractLastFrame failed", error);
    return { ok: false, error: "Could not reach the frame extraction endpoint" };
  }
}

export async function stitchClips(
  videoUrls: string[]
): Promise<{ ok: true; ref: JobStorageRef; durationSeconds: number } | { ok: false; error: string }> {
  if (videoUrls.length === 0) return { ok: false, error: "No clips to stitch" };
  if (videoUrls.length === 1) {
    // Nothing to concatenate - the single clip IS the final video.
    return { ok: true, ref: { provider: "blob", url: videoUrls[0]! }, durationSeconds: 0 };
  }

  const endpointUrl = process.env.VIDEO_STITCH_ENDPOINT_URL;
  if (!endpointUrl) {
    return {
      ok: false,
      error: "Clip stitching has no endpoint configured yet (set VIDEO_STITCH_ENDPOINT_URL) - this is a plain ffmpeg operation, no GPU required",
    };
  }

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrls }),
      signal: AbortSignal.timeout(240_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.videoUrl) {
      return { ok: false, error: data?.error ?? "Stitching endpoint rejected the request" };
    }
    return { ok: true, ref: { provider: "blob", url: data.videoUrl }, durationSeconds: data.durationSeconds ?? 0 };
  } catch (error) {
    console.error("[avatar-studio/video-stitch-agent] stitchClips failed", error);
    return { ok: false, error: "Could not reach the stitching endpoint" };
  }
}
