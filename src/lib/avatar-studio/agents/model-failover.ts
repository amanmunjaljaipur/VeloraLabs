import { listModels, getFreeTierFallback, type ModelKind } from "@/lib/avatar-studio/model-catalog";
import type { GenerationResult } from "@/lib/avatar-studio/agents/types";

/**
 * Shared multi-model failover: "if one model is out of free quota, use
 * another, until all are exhausted." Used by both the single-clip pipeline
 * (queue-agent.ts) and the long-form pipeline (long-form-agent.ts), which
 * needs it far more - a 20-minute video means dozens of generation calls,
 * making quota exhaustion on any one model likely mid-job.
 *
 * Try order: the user's selected model first, then the rest of that kind's
 * catalog, then the zero-token free-tier fallback LAST - it's the model
 * most likely to still have room once every paid option is tapped out, so
 * it's kept as the final safety net rather than tried early.
 *
 * Treats ANY failure from `attempt()` as failover-eligible, not just
 * quota/429-shaped errors - we don't yet know each self-hosted endpoint's
 * real error taxonomy. Tighten this to specific error codes once live
 * endpoints exist and their failure modes are known.
 */

export interface FailoverOutcome {
  result: GenerationResult;
  /** The model that actually produced the successful result, or null if every model failed. */
  modelIdUsed: string | null;
  /** Every model tried, in order - kept on the job record as an audit trail. */
  attemptedModels: string[];
}

export async function generateWithFailover(
  kind: ModelKind,
  preferredModelId: string,
  attempt: (modelId: string) => Promise<GenerationResult>
): Promise<FailoverOutcome> {
  const [catalog, freeFallback] = await Promise.all([listModels(kind), getFreeTierFallback(kind)]);

  const rest = catalog.filter((m) => m.id !== preferredModelId && m.id !== freeFallback?.id).map((m) => m.id);
  const order = [
    preferredModelId,
    ...rest,
    ...(freeFallback && freeFallback.id !== preferredModelId ? [freeFallback.id] : []),
  ];

  const attemptedModels: string[] = [];
  let lastResult: GenerationResult = {
    ok: false,
    storageRef: null,
    durationSeconds: null,
    error: `No ${kind} models are configured`,
  };

  for (const modelId of order) {
    attemptedModels.push(modelId);
    lastResult = await attempt(modelId);
    if (lastResult.ok) {
      return { result: lastResult, modelIdUsed: modelId, attemptedModels };
    }
  }

  return {
    result: {
      ...lastResult,
      error: `All ${attemptedModels.length} available ${kind} model(s) failed or are exhausted. Last error: ${lastResult.error ?? "unknown"}`,
    },
    modelIdUsed: null,
    attemptedModels,
  };
}
