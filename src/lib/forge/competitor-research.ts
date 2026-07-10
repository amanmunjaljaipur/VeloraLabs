/**
 * Lightweight competitor scan for App Builder V2's single-prompt research step.
 * Uses the model's own training knowledge — not live web browsing — so results
 * are framed honestly as general market knowledge, not a live scrape.
 */

import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import type { AppLlmSecrets } from "@/lib/app-builder/types";
import type { ForgeCompetitor } from "@/lib/forge/types";

export async function researchCompetitors(input: {
  prompt: string;
  brandName?: string;
  secrets: AppLlmSecrets;
}): Promise<ForgeCompetitor[]> {
  try {
    const raw = await callUserLlm({
      secrets: input.secrets,
      temperature: 0.3,
      maxTokens: 900,
      timeoutMs: 30_000,
      messages: [
        {
          role: "system",
          content: `You are a product researcher. Given a product idea, name 2-4 REAL, well-known products or companies that compete in this space, based on your general knowledge (not live browsing — be honest, don't invent fake companies).
For each: what they do well, and a specific gap or weakness a new entrant could exploit.
Return ONLY JSON: {"competitors":[{"name":"...","whatTheyDoWell":"...","gap":"..."}]}
If you genuinely don't know real competitors for this idea, return an empty array rather than inventing names.`,
        },
        {
          role: "user",
          content: `Product idea: ${input.prompt}${input.brandName ? `\nWorking name: ${input.brandName}` : ""}`,
        },
      ],
    });
    const parsed = parseJsonObject<{ competitors?: ForgeCompetitor[] }>(raw);
    if (!Array.isArray(parsed.competitors)) return [];
    return parsed.competitors
      .filter((c) => c && c.name)
      .slice(0, 4)
      .map((c) => ({
        name: String(c.name).slice(0, 60),
        whatTheyDoWell: String(c.whatTheyDoWell || "").slice(0, 200),
        gap: String(c.gap || "").slice(0, 200),
      }));
  } catch (e) {
    console.error("[forge/competitor-research]", e);
    return [];
  }
}
