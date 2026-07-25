import { getModel } from "@/lib/avatar-studio/model-catalog";
import type { GenerationResult } from "@/lib/avatar-studio/agents/types";

/**
 * Voice Agent: TTS/voice-cloning generation. This sandbox has no GPU and
 * cannot host Coqui XTTS-v2 / OpenVoice / F5-TTS / Bark / Piper / MMS-TTS
 * itself, so this agent is intentionally a real, working DISPATCHER with a
 * stubbed backend: it checks whether the model's endpointEnvVar
 * (model-catalog.ts) is set to a real self-hosted inference URL and, if so,
 * calls it with a small, documented contract; if not, it fails clearly
 * rather than pretending to produce audio. This is what "models stubbed"
 * means concretely - swap in a real endpoint URL and this agent works
 * without further code changes, since the contract below is already
 * defined.
 *
 * Expected endpoint contract (implement this on your GPU host):
 *   POST {endpointEnvVar url}
 *   body: { text: string, voiceProfileId?: string, qualityTier: string }
 *   response: { audioUrl: string } | { error: string }
 */

export async function generateVoice(
  voiceModelId: string,
  script: string,
  qualityTier: string,
  voiceProfileId: string | null
): Promise<GenerationResult> {
  const model = await getModel(voiceModelId);
  if (!model || model.kind !== "voice") {
    return { ok: false, storageRef: null, durationSeconds: null, error: "Unknown voice model" };
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
      body: JSON.stringify({ text: script, voiceProfileId, qualityTier }),
      signal: AbortSignal.timeout(120_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.audioUrl) {
      return { ok: false, storageRef: null, durationSeconds: null, error: data?.error ?? `${model.label} endpoint rejected the request` };
    }
    return { ok: true, storageRef: { provider: "blob", url: data.audioUrl }, durationSeconds: data.durationSeconds ?? null, error: null };
  } catch (error) {
    console.error("[avatar-studio/voice-agent] endpoint call failed", error);
    return { ok: false, storageRef: null, durationSeconds: null, error: `Could not reach the ${model.label} endpoint` };
  }
}
