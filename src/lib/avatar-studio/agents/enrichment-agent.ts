import { getCategory } from "@/lib/avatar-studio/categories-store";

/**
 * Enrichment Agent: applies the category's tone/structure guidance (and,
 * later, a personalization/brand-kit profile once that layer exists) to a
 * script before it reaches Moderation/generation. Kept deliberately simple
 * and deterministic for now - a light annotation pass, not another LLM
 * call, since the Intake Agent's category-aware generation already does the
 * heavy lifting for auto-generated scripts; this mainly matters for
 * user-typed/uploaded scripts that skip the Intake Agent's LLM step.
 */

export interface EnrichedScript {
  script: string;
  categoryId: string;
  categoryLabel: string;
  moderationLevel: "standard" | "elevated";
}

export async function enrichScript(categoryId: string, script: string): Promise<{ ok: true; result: EnrichedScript } | { ok: false; error: string }> {
  const category = await getCategory(categoryId);
  if (!category) return { ok: false, error: "Unknown category" };

  return {
    ok: true,
    result: {
      script: script.trim(),
      categoryId: category.id,
      categoryLabel: category.label,
      moderationLevel: category.moderationLevel,
    },
  };
}
