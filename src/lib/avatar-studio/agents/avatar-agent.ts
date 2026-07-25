import { getModel } from "@/lib/avatar-studio/model-catalog";
import type { GenerationResult } from "@/lib/avatar-studio/agents/types";

/**
 * Avatar Agent: avatar/lip-sync rendering (Duix-Avatar / MuseTalk /
 * Wav2Lip). Same real-dispatcher-with-stubbed-backend design as
 * voice-agent.ts - see that file's docstring for the reasoning. Runs after
 * the Voice Agent, since lip-sync needs the generated audio as input.
 *
 * `referenceImageUrl` is optional and only used by long-form-agent.ts's
 * clip-chaining: when set, it's the previous clip's last extracted frame,
 * and the endpoint should use it as the starting frame/pose for this clip
 * so a multi-clip long-form video doesn't visibly "jump" between segments.
 * A single-clip job never sets this.
 *
 * Expected endpoint contract (implement this on your GPU host):
 *   POST {endpointEnvVar url}
 *   body: { audioUrl: string, avatarProfileId?: string, qualityTier: string, referenceImageUrl?: string }
 *   response: { videoUrl: string, durationSeconds: number } | { error: string }
 */

export async function generateAvatarVideo(
  avatarModelId: string,
  audioUrl: string,
  qualityTier: string,
  avatarProfileId: string | null,
  referenceImageUrl?: string | null
): Promise<GenerationResult> {
  const model = await getModel(avatarModelId);
  if (!model || model.kind !== "avatar") {
    return { ok: false, storageRef: null, durationSeconds: null, error: "Unknown avatar model" };
  }

  const endpointUrl = process.env[model.endpointEnvVar];
  if (!endpointUrl) {
    return {
      ok: false,
      storageRef: null,
      durationSeconds: null,
      error: `${model.label} has no self-hosted endpoint configured yet (set ${model.endpointEnvVar}) - this is expected until real GPU infrastructure is wired up`,
    };
  }

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl, avatarProfileId, qualityTier, referenceImageUrl: referenceImageUrl ?? undefined }),
      signal: AbortSignal.timeout(180_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.videoUrl) {
      return { ok: false, storageRef: null, durationSeconds: null, error: data?.error ?? `${model.label} endpoint rejected the request` };
    }
    return {
      ok: true,
      storageRef: { provider: "blob", url: data.videoUrl },
      durationSeconds: data.durationSeconds ?? null,
      error: null,
    };
  } catch (error) {
    console.error("[avatar-studio/avatar-agent] endpoint call failed", error);
    return { ok: false, storageRef: null, durationSeconds: null, error: `Could not reach the ${model.label} endpoint` };
  }
}
