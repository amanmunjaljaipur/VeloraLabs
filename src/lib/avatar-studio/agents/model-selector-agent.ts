import { getModel, getFreeTierFallback, type QualityTier } from "@/lib/avatar-studio/model-catalog";
import { getBalance, consumeTokens } from "@/lib/avatar-studio/token-ledger-store";

/**
 * Model Selector Agent: computes the token cost of a voice+avatar model
 * pair at a given quality tier, checks the user's balance, and (on
 * confirm) deducts tokens - the metering system from Section 6. Estimates
 * output duration from script word count (~150 wpm average speaking rate)
 * since no real TTS exists yet to measure actual duration; re-estimate
 * against real audio duration once the Voice Agent is wired to a live
 * endpoint.
 */

const WORDS_PER_MINUTE = 150;

export function estimateDurationMinutes(script: string): number {
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(0.25, wordCount / WORDS_PER_MINUTE);
}

export interface CostEstimate {
  tokens: number;
  voiceTokens: number;
  avatarTokens: number;
  estimatedMinutes: number;
}

export async function estimateJobCost(
  voiceModelId: string,
  avatarModelId: string,
  qualityTier: QualityTier,
  script: string
): Promise<{ ok: true; estimate: CostEstimate } | { ok: false; error: string }> {
  const [voiceModel, avatarModel] = await Promise.all([getModel(voiceModelId), getModel(avatarModelId)]);
  if (!voiceModel || voiceModel.kind !== "voice") return { ok: false, error: "Unknown voice model" };
  if (!avatarModel || avatarModel.kind !== "avatar") return { ok: false, error: "Unknown avatar model" };

  const estimatedMinutes = estimateDurationMinutes(script);
  const voiceTokens = Math.ceil(voiceModel.tokenCostPerMinute[qualityTier] * estimatedMinutes);
  const avatarTokens = Math.ceil(avatarModel.tokenCostPerMinute[qualityTier] * estimatedMinutes);

  return {
    ok: true,
    estimate: { tokens: voiceTokens + avatarTokens, voiceTokens, avatarTokens, estimatedMinutes },
  };
}

/**
 * If the user can't afford their chosen pair, suggests the zero-token
 * fallback models so free users are never fully blocked (Section 11) -
 * only limited in choice, per the spec's explicit design intent.
 */
export async function suggestFreeFallback(): Promise<{ voiceModelId: string; avatarModelId: string } | null> {
  const [voice, avatar] = await Promise.all([getFreeTierFallback("voice"), getFreeTierFallback("avatar")]);
  if (!voice || !avatar) return null;
  return { voiceModelId: voice.id, avatarModelId: avatar.id };
}

export async function checkAndReserveTokens(
  email: string,
  jobId: string,
  voiceModelId: string,
  avatarModelId: string,
  qualityTier: QualityTier,
  estimate: CostEstimate
): Promise<{ ok: true } | { ok: false; error: string; fallback: { voiceModelId: string; avatarModelId: string } | null }> {
  const balance = await getBalance(email);
  if (balance.balance < estimate.tokens) {
    const fallback = await suggestFreeFallback();
    return {
      ok: false,
      error: `You need ${estimate.tokens} tokens for this combination but have ${balance.balance}. Resets ${new Date(balance.periodResetAt).toLocaleDateString()}.`,
      fallback,
    };
  }

  if (estimate.voiceTokens > 0) {
    await consumeTokens(email, estimate.voiceTokens, { jobId, modelId: voiceModelId, qualityTier });
  }
  if (estimate.avatarTokens > 0) {
    await consumeTokens(email, estimate.avatarTokens, { jobId, modelId: avatarModelId, qualityTier });
  }
  return { ok: true };
}
