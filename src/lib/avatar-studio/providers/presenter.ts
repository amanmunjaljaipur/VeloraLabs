import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { uploadUserMedia } from "@/lib/avatar-studio/storage-adapter";
import { renderAnimatedPresenterVideo } from "@/lib/avatar-studio/providers/animated-presenter";
import type { JobStorageRef } from "@/lib/avatar-studio/jobs-store";

/**
 * Free Presenter path:
 * 1) Portrait (user photo or Pollinations)
 * 2) Animated MP4 via ffmpeg (Ken Burns / motion) + narrated audio
 * 3) Fallback: still + audio only if ffmpeg fails
 *
 * True lip-sync still requires a GPU endpoint (MuseTalk etc.).
 */

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  "https://www.verlinlabs.com"
).replace(/\/$/, "");

export interface PresenterPackage {
  kind: "presenter" | "video";
  audio: JobStorageRef;
  poster: JobStorageRef;
  /** Real MP4 when animation succeeds. */
  video: JobStorageRef | null;
  durationSeconds: number;
  primary: JobStorageRef;
}

async function uploadPrivateImage(email: string, bytes: Buffer, mimeType: string): Promise<JobStorageRef> {
  return uploadUserMedia(email, `presenter-poster-${randomUUID()}.jpg`, bytes, mimeType);
}

export async function generatePresenterPortrait(
  email: string,
  stylePrompt: string | null,
  existingPortraitUrl: string | null
): Promise<{ ok: true; ref: JobStorageRef } | { ok: false; error: string }> {
  if (existingPortraitUrl) {
    return { ok: true, ref: { provider: "blob", url: existingPortraitUrl } };
  }

  const prompt =
    stylePrompt?.trim() ||
    "professional friendly presenter portrait looking at camera, natural expression, soft studio lighting, upper body, clean blurred background, photorealistic, high detail face";
  const seed = Math.floor(Math.random() * 1_000_000);
  const genUrl = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?width=768&height=1024&nologo=true&seed=${seed}`;

  try {
    const res = await fetch(genUrl, { signal: AbortSignal.timeout(45_000) });
    if (!res.ok) return { ok: false, error: `Portrait generation failed (${res.status})` };
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.byteLength < 500) return { ok: false, error: "Portrait generation returned an empty image" };
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const ref = await uploadPrivateImage(email, bytes, contentType);
    return { ok: true, ref };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Portrait generation failed" };
  }
}

export async function buildPresenterPackage(input: {
  email: string;
  audioRef: JobStorageRef;
  durationSeconds: number;
  stylePrompt: string | null;
  portraitUrl: string | null;
  scriptPreview?: string;
  onProgress?: (percent: number, label: string) => void | Promise<void>;
}): Promise<{ ok: true; package: PresenterPackage } | { ok: false; error: string }> {
  await input.onProgress?.(48, "Creating presenter portrait…");
  const portrait = await generatePresenterPortrait(input.email, input.stylePrompt, input.portraitUrl);
  if (!portrait.ok) return { ok: false, error: portrait.error };

  await input.onProgress?.(58, "Building animated talking video…");
  const animated = await renderAnimatedPresenterVideo({
    email: input.email,
    imageUrl: portrait.ref.url,
    audioUrl: input.audioRef.url,
    durationSeconds: input.durationSeconds,
    scriptPreview: input.scriptPreview,
    onProgress: input.onProgress,
  });

  if (animated.ok) {
    return {
      ok: true,
      package: {
        kind: "video",
        audio: input.audioRef,
        poster: portrait.ref,
        video: animated.video,
        durationSeconds: animated.durationSeconds,
        primary: animated.video,
      },
    };
  }

  // Fallback: still + audio (UI player can still animate lightly client-side)
  console.warn("[presenter] animation failed, falling back to still+audio:", animated.error);
  await input.onProgress?.(90, "Animation unavailable — delivering still + audio…");
  return {
    ok: true,
    package: {
      kind: "presenter",
      audio: input.audioRef,
      poster: portrait.ref,
      video: null,
      durationSeconds: input.durationSeconds,
      primary: portrait.ref,
    },
  };
}

export async function hostAudioBuffer(email: string, audio: Buffer, filename = "voice.mp3"): Promise<JobStorageRef> {
  return uploadUserMedia(email, filename, audio, "audio/mpeg");
}

export async function hostJsonManifest(email: string, data: unknown): Promise<JobStorageRef> {
  const key = `verlin-labs/avatar-studio/${email.replace(/[^a-z0-9]/gi, "_")}/${randomUUID()}-presenter.json`;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Use media adapter local path via upload of JSON as file
    return uploadUserMedia(email, `manifest-${randomUUID()}.json`, Buffer.from(JSON.stringify(data)), "application/json");
  }
  await put(key, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  return { provider: "blob", url: `${SITE_URL}/api/media/${key}` };
}
