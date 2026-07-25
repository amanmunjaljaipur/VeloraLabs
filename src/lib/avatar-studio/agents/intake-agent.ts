import { createChatCompletion, isLlmConfigured, type ChatCompletionMessage } from "@/lib/chat/llm-client";
import { getCategory } from "@/lib/avatar-studio/categories-store";

/**
 * Intake Agent: turns either a user-provided raw script OR a category+topic
 * into a structured script ready for the Enrichment Agent. Auto-generated
 * scripts are always returned for user review/edit, never auto-rendered
 * directly (Section 5's non-negotiable) - enforced by the caller (the
 * generate-script API route returns the draft; a separate, later "create
 * job" call is what actually renders).
 */

export async function generateScriptFromCategory(categoryId: string, topic: string): Promise<{ ok: true; script: string } | { ok: false; error: string }> {
  const category = await getCategory(categoryId);
  if (!category) return { ok: false, error: "Unknown category" };
  if (!isLlmConfigured()) return { ok: false, error: "Script generation is not configured yet" };

  try {
    const completion = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `You write narration scripts for short AI-avatar videos. Category: "${category.label}". Style guidance: ${category.promptGuidance} Write only the spoken narration, no stage directions, no timestamps, no markdown. Keep it under 400 words.`,
        },
        { role: "user", content: `Write a video script about: ${topic}` },
      ],
      temperature: 0.6,
      maxTokens: 900,
    });
    return { ok: true, script: completion.content.trim() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Script generation failed" };
  }
}

const WORDS_PER_MINUTE = 150;
const MAX_EXTEND_ROUNDS = 3;

/**
 * Long-form variant of generateScriptFromCategory: targets a specific
 * duration (10-20+ min, per the long-form video capability) instead of the
 * ~400-word default. A single completion often can't reach 1500-3000+
 * words reliably, so this asks the model to continue from where it left
 * off, up to MAX_EXTEND_ROUNDS times, stopping once it's within 85% of the
 * target rather than forcing an exact word count. Still returns a draft for
 * the user to review/edit before anything renders - same non-negotiable as
 * the short-form path.
 */
export async function generateLongFormScript(
  categoryId: string,
  topic: string,
  targetDurationMinutes: number
): Promise<{ ok: true; script: string } | { ok: false; error: string }> {
  const category = await getCategory(categoryId);
  if (!category) return { ok: false, error: "Unknown category" };
  if (!isLlmConfigured()) return { ok: false, error: "Script generation is not configured yet" };

  const targetWords = Math.round(targetDurationMinutes * WORDS_PER_MINUTE);
  const systemPrompt = `You write narration scripts for AI-avatar videos. Category: "${category.label}". Style guidance: ${category.promptGuidance} Write only the spoken narration, no stage directions, no timestamps, no markdown, no section headers or labels. Target length: approximately ${targetWords} words (about ${targetDurationMinutes} minutes of spoken narration) - this is a long-form script, so develop substantial, well-organized content across multiple sub-topics to reach that length naturally. Do not pad with repetition or filler.`;

  try {
    let script = "";
    let messages: ChatCompletionMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Write a long-form video script about: ${topic}` },
    ];

    for (let round = 0; round < MAX_EXTEND_ROUNDS; round++) {
      const completion = await createChatCompletion({ messages, temperature: 0.65, maxTokens: 6000 });
      const chunk = completion.content.trim();
      if (!chunk) break;
      script = script ? `${script}\n\n${chunk}` : chunk;

      const wordCount = script.split(/\s+/).filter(Boolean).length;
      if (wordCount >= targetWords * 0.85) break;

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Write a long-form video script about: ${topic}` },
        { role: "assistant", content: chunk },
        {
          role: "user",
          content: `Continue the script directly from where you left off - do not repeat anything, do not restart, do not add a conclusion unless the full target length has been reached. Keep going until the full ~${targetWords}-word target is met.`,
        },
      ];
    }

    if (!script) return { ok: false, error: "Long-form script generation returned no content" };
    return { ok: true, script: script.trim() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Long-form script generation failed" };
  }
}

/** Raw/document-provided script - light normalization only, no LLM call. Document parsing (PPTX/PDF/DOCX) is a later build phase; for now this accepts already-extracted plain text. */
export function normalizeRawScript(rawText: string): { ok: true; script: string } | { ok: false; error: string } {
  const trimmed = rawText.trim().replace(/\r\n/g, "\n");
  if (!trimmed) return { ok: false, error: "Script is empty" };
  if (trimmed.length > 20_000) return { ok: false, error: "Script is too long (max ~20,000 characters)" };
  return { ok: true, script: trimmed };
}
