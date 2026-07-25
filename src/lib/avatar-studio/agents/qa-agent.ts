import type { QaResult } from "@/lib/avatar-studio/agents/types";

/**
 * QA Agent: post-render automated check. Real implementation would score
 * lip-sync confidence, audio clipping, and visual artifacts by inspecting
 * the actual output - not possible without a GPU host to run those models
 * against. This stub checks what's actually knowable at this layer
 * (generation succeeded, duration is plausible relative to the script) and
 * scores accordingly, so the retry-below-threshold control flow in
 * queue-agent.ts is real and exercised even though the underlying quality
 * signal is a placeholder.
 */

const QA_PASS_THRESHOLD = 70;

export function evaluateOutput(input: {
  voiceOk: boolean;
  avatarOk: boolean;
  durationSeconds: number | null;
  expectedMinutes: number;
}): QaResult {
  if (!input.voiceOk || !input.avatarOk) {
    return { score: 0, passed: false, notes: "Generation did not complete successfully" };
  }

  if (input.durationSeconds == null) {
    // No real duration to check yet (stubbed endpoint didn't return one) -
    // pass at a modest score rather than failing on missing data that
    // isn't the generation's fault.
    return { score: 75, passed: true, notes: "Generation succeeded; duration not reported by endpoint" };
  }

  const expectedSeconds = input.expectedMinutes * 60;
  const ratio = input.durationSeconds / expectedSeconds;
  const withinRange = ratio > 0.5 && ratio < 2;
  const score = withinRange ? 90 : 40;
  return {
    score,
    passed: score >= QA_PASS_THRESHOLD,
    notes: withinRange
      ? "Duration plausible relative to script length"
      : `Output duration (${Math.round(input.durationSeconds)}s) is far from the expected ~${Math.round(expectedSeconds)}s`,
  };
}

export { QA_PASS_THRESHOLD };
