/**
 * Smoke-test App Studio expand + research for multi-role working apps.
 * Usage (do NOT commit keys):
 *   $env:GROQ_API_KEY="gsk_..."; npx tsx scripts/test-app-studio-expand.ts
 *
 * Exit 0 = all prompts produce a valid multi-role appSpec.
 */

import { expandAndBuildAppSpec } from "../src/lib/app-studio/build-app-spec";
import { researchStudioIdea } from "../src/lib/app-studio/generate";
import { buildHeuristicAppSpec } from "../src/lib/app-studio/build-app-spec";
import type { AppLlmSecrets } from "../src/lib/app-builder/types";
import type { StudioAppSpec } from "../src/lib/app-studio/types";

const PROMPTS = [
  "Digital banking app for India: savings, UPI transfers, freeze cards, support cases — multi-role customer, support, ops",
  "Yoga studio booking: members book classes, instructors see roster, owner manages all bookings",
  "Resume career tool ResumeLift: job seekers build resumes with tips and LinkedIn checklist; coaches review",
  "Team expense tracker: employees submit claims, managers approve or reject on a board",
  "Sales CRM pipeline: reps log leads, managers advance deals through stages",
];

function validate(spec: StudioAppSpec, label: string): string[] {
  const errors: string[] = [];
  if (!spec.brandName?.trim()) errors.push(`${label}: missing brandName`);
  if (!spec.rewrittenPrompt || spec.rewrittenPrompt.length < 80) {
    errors.push(`${label}: rewrittenPrompt too short`);
  }
  if (!spec.roles || spec.roles.length < 2) {
    errors.push(`${label}: need ≥2 roles (got ${spec.roles?.length ?? 0})`);
  }
  if (!spec.entities?.length) errors.push(`${label}: no entities`);
  if (!spec.screens || spec.screens.length < 3) {
    errors.push(`${label}: need ≥3 screens (got ${spec.screens?.length ?? 0})`);
  }
  if (!spec.workflows || spec.workflows.length < 2) {
    errors.push(`${label}: need ≥2 workflows (got ${spec.workflows?.length ?? 0})`);
  }
  const roleIds = new Set(spec.roles.map((r) => r.id));
  for (const w of spec.workflows || []) {
    if (!roleIds.has(w.roleId)) errors.push(`${label}: workflow ${w.id} bad roleId ${w.roleId}`);
    if (!spec.screens.some((s) => s.id === w.screenId)) {
      errors.push(`${label}: workflow ${w.id} missing screen ${w.screenId}`);
    }
  }
  for (const e of spec.entities || []) {
    if (!e.seed || e.seed.length < 2) {
      errors.push(`${label}: entity ${e.id} needs ≥2 seed rows`);
    }
  }
  const defaults = (spec.roles || []).filter((r) => r.isDefault);
  if (defaults.length !== 1) {
    errors.push(`${label}: exactly one default role required (got ${defaults.length})`);
  }
  return errors;
}

function summarize(spec: StudioAppSpec) {
  return {
    brand: spec.brandName,
    roles: spec.roles.map((r) => r.label).join(" | "),
    screens: spec.screens.length,
    workflows: spec.workflows.map((w) => w.name).join("; "),
    entities: spec.entities.map((e) => `${e.name}(${e.seed?.length || 0})`).join(", "),
    briefChars: spec.rewrittenPrompt?.length || 0,
  };
}

async function main() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    console.error("FAIL: set GROQ_API_KEY env (do not commit the key)");
    process.exit(1);
  }

  const secrets: AppLlmSecrets = {
    provider: "groq",
    apiKey,
    model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
  };

  console.log("=== Heuristic-only smoke (no LLM) ===");
  let failed = 0;
  for (const prompt of PROMPTS) {
    const h = buildHeuristicAppSpec(prompt);
    const errs = validate(h, `heuristic:${h.brandName}`);
    if (errs.length) {
      failed++;
      console.error("FAIL", summarize(h), errs);
    } else {
      console.log("OK  ", summarize(h));
    }
  }

  console.log("\n=== Groq research + expand (LLM) ===");
  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i];
    const short = prompt.slice(0, 70) + "…";
    console.log(`\n[${i + 1}/${PROMPTS.length}] ${short}`);
    // Space out calls — free Groq TPM is tight
    if (i > 0) {
      console.log("  waiting 12s for rate limit…");
      await new Promise((r) => setTimeout(r, 12_000));
    }
    try {
      const t0 = Date.now();
      const research = await researchStudioIdea({ prompt, secrets });
      const { appSpec } = await expandAndBuildAppSpec({ prompt, research, secrets });
      const ms = Date.now() - t0;
      const errs = validate(appSpec, appSpec.brandName);
      if (errs.length) {
        failed++;
        console.error("FAIL", { ms, ...summarize(appSpec) }, errs);
      } else {
        console.log("OK  ", {
          ms,
          researchUsers: research.targetUsers?.slice(0, 3),
          researchWorkflows: research.coreWorkflows?.length,
          briefChars: appSpec.rewrittenPrompt.length,
          ...summarize(appSpec),
        });
      }
    } catch (e) {
      failed++;
      console.error("FAIL exception:", e instanceof Error ? e.message : e);
    }
  }

  console.log("\n=== Result ===");
  if (failed) {
    console.error(`${failed} check(s) failed — do not deploy`);
    process.exit(1);
  }
  console.log("All prompts produced valid multi-role appSpecs. Safe to deploy.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
