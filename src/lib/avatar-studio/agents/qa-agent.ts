import type { QaResult } from "@/lib/avatar-studio/agents/types";

/**
 * QA Agent: post-render check.
 *
 * CRITICAL: Never fail a freemium Presenter job solely because free-TTS
 * duration estimates disagree with word-count (e.g. 60s vs ~28s). That was
 * blocking real successful generations in the browser.
 */

const QA_PASS_THRESHOLD = 70;

export function evaluateOutput(input: {
  voiceOk: boolean;
  avatarOk: boolean;
  durationSeconds: number | null;
  expectedMinutes: number;
  /** Free Presenter / free TTS — duration vs word-count is advisory only. */
  softMode?: boolean;
}): QaResult {
  if (!input.voiceOk || !input.avatarOk) {
    return { score: 0, passed: false, notes: "Generation did not complete successfully" };
  }

  // Soft mode (Presenter) OR any successful free path: deliver the job.
  // Only reject empty audio if duration is reported as essentially zero.
  if (input.softMode) {
    if (input.durationSeconds != null && input.durationSeconds > 0 && input.durationSeconds < 0.4) {
      return {
        score: 25,
        passed: false,
        notes: `Output duration (${input.durationSeconds}s) is too short to be usable`,
      };
    }
    return {
      score: 90,
      passed: true,
      notes:
        input.durationSeconds != null
          ? `Presenter ready (~${Math.round(input.durationSeconds)}s)`
          : "Presenter ready",
    };
  }

  if (input.durationSeconds == null) {
    return { score: 80, passed: true, notes: "Generation succeeded; duration not reported" };
  }

  const expectedSeconds = Math.max(1, input.expectedMinutes * 60);
  const ratio = input.durationSeconds / expectedSeconds;

  // If generation succeeded, never hard-fail on duration alone.
  // Extreme outliers get a lower score but still pass so users get their file.
  if (ratio > 0.05 && ratio < 20) {
    const withinComfort = ratio > 0.25 && ratio < 4;
    return {
      score: withinComfort ? 92 : 78,
      passed: true,
      notes: withinComfort
        ? "Duration plausible relative to script length"
        : `Duration ${Math.round(input.durationSeconds)}s vs expected ~${Math.round(expectedSeconds)}s (accepted)`,
    };
  }

  // Essentially empty or absurd — still pass with note if both stages OK
  // (true lip-sync hosts can report bad metadata). Prefer delivery.
  return {
    score: 72,
    passed: true,
    notes: `Duration metadata unusual (${Math.round(input.durationSeconds)}s); generation succeeded so job is delivered`,
  };
}

export { QA_PASS_THRESHOLD };
