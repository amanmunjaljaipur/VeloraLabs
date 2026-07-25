import { createChatCompletion, isLlmConfigured } from "@/lib/chat/llm-client";
import type { ModerationResult } from "@/lib/avatar-studio/agents/types";

/**
 * Moderation Agent: screens a script (text only - no reference media check
 * yet, that needs a vision-capable model and real face/voice comparison,
 * out of scope for this scaffold) before any GPU time is spent. Category-
 * aware: "elevated" categories (Trend/Reaction, News/Commentary - per
 * Section 5, higher impersonation risk) apply a stricter bar.
 *
 * Fails CLOSED: if the check itself errors (LLM unavailable, unparseable
 * response), the script is rejected rather than waved through - a safety
 * check that silently passes on failure isn't a safety check. This is a
 * text-only heuristic, not a legal determination - it's the automated
 * first pass the spec calls for, not a substitute for the human review
 * path Section 13 already provides for a moderation rejection.
 */

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in moderation response");
  return JSON.parse(match[0]);
}

export async function moderateScript(
  script: string,
  moderationLevel: "standard" | "elevated"
): Promise<ModerationResult> {
  if (!isLlmConfigured()) {
    return { approved: false, reason: "Moderation check is not configured - cannot process scripts right now", flaggedTerms: [] };
  }

  const strictness =
    moderationLevel === "elevated"
      ? "This category carries higher impersonation risk. Flag ANY mention of a real, identifiable, named person or organization for human review, even if the reference seems benign - err toward flagging."
      : "Flag mentions of a real, identifiable, named person only if the script impersonates them, puts words in their mouth, or otherwise uses their likeness/identity without clear indication of their own authorization.";

  try {
    const completion = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `You are a content moderation checker for an AI avatar video platform. Reject scripts that: (1) impersonate a real person without clear authorization, (2) involve minors in any romantic/sexual/exploitative context, (3) are defamatory, harassing, or intentionally deceptive, (4) request illegal content. ${strictness} Respond with ONLY a JSON object, no other text: {"approved": boolean, "reason": string or null, "flaggedTerms": string[]}`,
        },
        { role: "user", content: script.slice(0, 6000) },
      ],
      temperature: 0.1,
      maxTokens: 300,
    });

    const parsed = extractJson(completion.content) as Partial<ModerationResult>;
    return {
      approved: Boolean(parsed.approved),
      reason: typeof parsed.reason === "string" ? parsed.reason : null,
      flaggedTerms: Array.isArray(parsed.flaggedTerms) ? parsed.flaggedTerms.filter((t): t is string => typeof t === "string") : [],
    };
  } catch (error) {
    console.error("[avatar-studio/moderation] check failed, rejecting closed:", error);
    return { approved: false, reason: "Could not complete the moderation check - please try again", flaggedTerms: [] };
  }
}
