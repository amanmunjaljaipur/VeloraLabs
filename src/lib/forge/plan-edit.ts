/**
 * Natural-language plan edits + single-section regenerate.
 */

import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";
import type { AppLlmSecrets } from "@/lib/app-builder/types";
import type { ForgeBuildPlan } from "@/lib/forge/types";

export type PlanSectionKey =
  | "productSummary"
  | "roles"
  | "dataModels"
  | "features"
  | "screens"
  | "techStack"
  | "integrations"
  | "assumptions"
  | "all";

function deepClonePlan(plan: ForgeBuildPlan): ForgeBuildPlan {
  return JSON.parse(JSON.stringify(plan)) as ForgeBuildPlan;
}

/** Apply local structural edits without LLM when instruction is simple */
function tryLocalEdit(plan: ForgeBuildPlan, instruction: string): ForgeBuildPlan | null {
  const text = instruction.trim().toLowerCase();
  const next = deepClonePlan(plan);

  // Remove admin role
  if (/remove\s+(the\s+)?admin\s+role/.test(text)) {
    next.roles = next.roles.filter((r) => !/admin/i.test(r.name) && r.id !== "admin");
    if (next.roles.length === 0) {
      next.roles = [
        {
          id: "user",
          name: "User",
          description: "Primary user",
          permissions: ["use core features"],
        },
      ];
    }
    next.assumptions.push({
      id: `edit_${Date.now()}`,
      text: `User removed admin role via plan edit: “${instruction.trim()}”`,
      fromDefault: false,
    });
    return next;
  }

  // Add wishlist feature
  if (/add\s+(a\s+)?wishlist/.test(text)) {
    if (!next.features.some((f) => /wishlist/i.test(f.title))) {
      next.features.push({
        id: `f_wishlist_${Date.now().toString(36)}`,
        title: "Wishlist",
        description: "Users can save items for later",
        priority: "should",
      });
    }
    if (!next.dataModels.some((m) => /wishlist/i.test(m.name))) {
      next.dataModels.push({
        id: "wishlist_item",
        name: "Wishlist item",
        fields: [
          { name: "userId", type: "relation", ref: "User", required: true },
          { name: "productId", type: "relation", ref: "Product", required: true },
          { name: "addedAt", type: "datetime" },
        ],
        relationships: ["Wishlist item → User", "Wishlist item → Product"],
      });
    }
    next.assumptions.push({
      id: `edit_${Date.now()}`,
      text: `User added wishlist via plan edit`,
      fromDefault: false,
    });
    return next;
  }

  // Recurring bookings
  if (/recurring/.test(text) && /book/.test(text)) {
    if (!next.features.some((f) => /recurring/i.test(f.title))) {
      next.features.push({
        id: `f_recur_${Date.now().toString(36)}`,
        title: "Recurring bookings",
        description: "Users can book repeating sessions (weekly/monthly)",
        priority: "must",
      });
    }
    const booking = next.dataModels.find((m) => /book/i.test(m.name));
    if (booking && !booking.fields.some((f) => /recur/i.test(f.name))) {
      booking.fields.push(
        { name: "recurring", type: "boolean" },
        { name: "recurrenceRule", type: "string" }
      );
    }
    next.assumptions.push({
      id: `edit_${Date.now()}`,
      text: "Bookings support recurrence",
      fromDefault: false,
    });
    return next;
  }

  return null;
}

export async function applyPlanEdit(input: {
  plan: ForgeBuildPlan;
  instruction: string;
  secrets?: AppLlmSecrets | null;
}): Promise<{ plan: ForgeBuildPlan; changedSections: string[]; note: string }> {
  const instruction = input.instruction.trim();
  if (!instruction) {
    return { plan: input.plan, changedSections: [], note: "Empty instruction" };
  }

  const local = tryLocalEdit(input.plan, instruction);
  if (local) {
    return {
      plan: local,
      changedSections: ["features", "dataModels", "roles", "assumptions"],
      note: "Applied structured edit",
    };
  }

  const secrets = input.secrets?.apiKey?.trim()
    ? input.secrets
    : resolveAppBuilderSecrets();

  if (!secrets) {
    // Heuristic: append as feature request assumption
    const plan = deepClonePlan(input.plan);
    plan.features.push({
      id: `f_nl_${Date.now().toString(36)}`,
      title: instruction.slice(0, 80),
      description: `Requested in plan edit: ${instruction}`,
      priority: "should",
    });
    plan.assumptions.push({
      id: `a_nl_${Date.now()}`,
      text: `Plan edit (no LLM): ${instruction}`,
      fromDefault: false,
    });
    return {
      plan,
      changedSections: ["features", "assumptions"],
      note: "Added as feature (AI offline) — refine manually if needed",
    };
  }

  try {
    const raw = await callUserLlm({
      secrets,
      temperature: 0.25,
      maxTokens: 4500,
      timeoutMs: 60_000,
      messages: [
        {
          role: "system",
          content: `You edit a Forge build plan JSON based on a user instruction.
Return ONLY JSON:
{
  "plan": <full ForgeBuildPlan object with same shape>,
  "changedSections": string[],
  "note": "one sentence what changed"
}
Keep version:1. Preserve fields you don't change. Do not invent unrelated products.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction,
            plan: input.plan,
          }),
        },
      ],
    });

    const parsed = parseJsonObject<{
      plan?: ForgeBuildPlan;
      changedSections?: string[];
      note?: string;
    }>(raw);

    if (!parsed.plan || typeof parsed.plan !== "object") {
      throw new Error("No plan in response");
    }

    const plan = {
      ...input.plan,
      ...parsed.plan,
      version: 1 as const,
      researchedAt: new Date().toISOString(),
      researchSource: `${input.plan.researchSource}+nl-edit`,
    };

    // Ensure arrays exist
    plan.roles = Array.isArray(plan.roles) ? plan.roles : input.plan.roles;
    plan.dataModels = Array.isArray(plan.dataModels)
      ? plan.dataModels
      : input.plan.dataModels;
    plan.features = Array.isArray(plan.features) ? plan.features : input.plan.features;
    plan.screens = Array.isArray(plan.screens) ? plan.screens : input.plan.screens;
    plan.integrations = Array.isArray(plan.integrations)
      ? plan.integrations
      : input.plan.integrations;
    plan.assumptions = Array.isArray(plan.assumptions)
      ? plan.assumptions
      : input.plan.assumptions;

    return {
      plan,
      changedSections: parsed.changedSections || ["all"],
      note: parsed.note || "Plan updated",
    };
  } catch (e) {
    console.error("[forge/plan-edit]", e);
    const plan = deepClonePlan(input.plan);
    plan.assumptions.push({
      id: `a_fail_${Date.now()}`,
      text: `Could not auto-apply: ${instruction}`,
      fromDefault: false,
    });
    return {
      plan,
      changedSections: ["assumptions"],
      note: "Edit failed — noted as assumption; try a simpler instruction",
    };
  }
}

export async function regeneratePlanSection(input: {
  plan: ForgeBuildPlan;
  section: PlanSectionKey;
  secrets?: AppLlmSecrets | null;
}): Promise<{ plan: ForgeBuildPlan; note: string }> {
  if (input.section === "all") {
    return { plan: input.plan, note: "Use full plan generation for all sections" };
  }

  const secrets = input.secrets?.apiKey?.trim()
    ? input.secrets
    : resolveAppBuilderSecrets();

  if (!secrets) {
    return { plan: input.plan, note: "AI unavailable — section unchanged" };
  }

  try {
    const raw = await callUserLlm({
      secrets,
      temperature: 0.35,
      maxTokens: 2500,
      timeoutMs: 45_000,
      messages: [
        {
          role: "system",
          content: `Regenerate ONLY the "${input.section}" section of a Forge plan.
Return ONLY JSON: { "sectionData": <new value for that section>, "note": string }
Match the existing TypeScript shape for that field.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            section: input.section,
            planSummary: {
              brandName: input.plan.brandName,
              productSummary: input.plan.productSummary,
              archetype: input.plan.archetype,
              domain: input.plan.domain,
            },
            current: input.plan[input.section as keyof ForgeBuildPlan],
            fullPlan: input.plan,
          }),
        },
      ],
    });

    const parsed = parseJsonObject<{ sectionData?: unknown; note?: string }>(raw);
    if (parsed.sectionData === undefined) {
      return { plan: input.plan, note: "No update returned" };
    }

    const plan = deepClonePlan(input.plan);
    const key = input.section as keyof ForgeBuildPlan;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (plan as any)[key] = parsed.sectionData;
    plan.researchedAt = new Date().toISOString();
    plan.researchSource = `${plan.researchSource}+regen:${input.section}`;
    return { plan, note: parsed.note || `Regenerated ${input.section}` };
  } catch (e) {
    console.error("[forge/regen]", e);
    return { plan: input.plan, note: "Regenerate failed" };
  }
}

/** Basic validity: screens exist, features exist, no empty brand */
export function validateForgePlan(plan: ForgeBuildPlan | null): {
  valid: boolean;
  errors: string[];
} {
  if (!plan) return { valid: false, errors: ["No plan yet"] };
  const errors: string[] = [];
  if (!plan.brandName?.trim()) errors.push("Add a product name");
  if (!plan.productSummary?.trim()) errors.push("Add a product summary");
  if (!plan.features?.length) errors.push("Add at least one feature");
  if (!plan.screens?.length) errors.push("Add at least one screen");
  if (!plan.roles?.length) errors.push("Add at least one role");
  // Orphan relation refs — soft check
  const entityNames = new Set(plan.dataModels.map((m) => m.name.toLowerCase()));
  entityNames.add("user");
  for (const model of plan.dataModels) {
    for (const field of model.fields) {
      if (field.ref && !entityNames.has(field.ref.toLowerCase())) {
        // allow soft orphans — warn only if many
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
