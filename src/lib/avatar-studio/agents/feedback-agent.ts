import { logFeedback, type CorrectionType } from "@/lib/avatar-studio/feedback-store";

/**
 * Feedback Agent: captures every correction/edit/regenerate/rating the
 * moment it happens (Section 7's "continuous logging" requirement) and
 * feeds the daily training pool. Thin wrapper over feedback-store.ts - kept
 * as its own agent module (rather than calling the store directly from
 * routes) so it's independently trackable in agents/README.md and gives a
 * single seam to add rate-limiting/validation later without touching the
 * store itself.
 */

export async function recordFeedback(input: {
  email: string;
  jobId: string;
  modelId: string;
  categoryId: string;
  correctionType: CorrectionType;
  original?: string | null;
  corrected?: string | null;
  note?: string | null;
}) {
  return logFeedback(input);
}
