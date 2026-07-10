/**
 * Convert DemoCategoryDef → full StudioAppSpec (roles, entities, screens, workflows).
 * Always runs Verlin educational content premiumization first.
 */

import type {
  StudioAppSpec,
  StudioEntity,
  StudioRole,
  StudioScreen,
  StudioWorkflow,
} from "@/lib/app-studio/types";
import {
  assertFiftyCategories,
  DEMO_CATEGORIES,
  getDemoCategory,
  type DemoCategoryDef,
} from "@/lib/demo-apps";
import { premiumizeDemoCategory } from "@/lib/demo-apps/premiumize";
import { resolveIndustryShell } from "@/lib/demo-apps/industry-shells";

export function buildDemoAppSpec(raw: DemoCategoryDef): StudioAppSpec {
  const def = premiumizeDemoCategory(raw);
  const shell = resolveIndustryShell(def);

  const roles: StudioRole[] = def.roles.map((r, i) => ({
    id: r.id,
    label: r.label,
    description: r.description,
    canCreate: r.canCreate !== false,
    canManage: Boolean(r.canManage),
    isDefault: r.isDefault ?? i === 0,
  }));

  // Exactly one default
  let saw = false;
  for (const r of roles) {
    if (r.isDefault) {
      if (saw) r.isDefault = false;
      else saw = true;
    }
  }
  if (!saw && roles[0]) roles[0].isDefault = true;

  const entities: StudioEntity[] = def.entities.map((e) => ({
    id: e.id,
    name: e.name,
    namePlural: e.namePlural,
    statuses: e.statuses,
    fields: e.fields.map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      options: f.options,
      required: f.required,
    })),
    seed: e.seeds.length
      ? e.seeds
      : [
          { title: `${e.name} sample A`, status: e.statuses[0] },
          { title: `${e.name} sample B`, status: e.statuses[1] || e.statuses[0] },
          { title: `${e.name} sample C`, status: e.statuses[0] },
          { title: `${e.name} sample D`, status: e.statuses[2] || e.statuses[0] },
        ],
  }));

  const screens: StudioScreen[] = def.modules.map((m) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    roleIds: m.roleIds || [],
    entityId: m.entityId,
    description: m.description,
  }));

  const workflows: StudioWorkflow[] = def.workflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    roleId: w.roleId,
    steps: w.steps,
    screenId: w.moduleId,
    entityId: w.entityId,
  }));

  // Ensure every role has a workflow
  for (const role of roles) {
    if (!workflows.some((w) => w.roleId === role.id)) {
      const screen =
        screens.find((s) => !s.roleIds.length || s.roleIds.includes(role.id)) || screens[0];
      workflows.push({
        id: `wf-auto-${role.id}`,
        name: `${role.label} path`,
        description: role.description,
        roleId: role.id,
        steps: ["Open app", "Use modules", "Complete action"],
        screenId: screen?.id || "home",
      });
    }
  }

  const learning = def.learning!;

  const rewrittenPrompt = `Build a complete multi-role product for category "${def.name}" named ${def.brandName}.

HERO
${learning.heroHeadline}
${learning.heroSub}

SUMMARY (Verlin educational voice)
${def.description}

WHO IT'S FOR
${learning.whoItsFor}

OUTCOMES
${learning.outcomes.map((o, i) => `${i + 1}. ${o}`).join("\n")}

HOW IT WORKS
${learning.howItWorks.map((h) => `- ${h.step}: ${h.detail}`).join("\n")}

EXAMPLES IN MARKET: ${def.examples.join(", ")}
IA BENCHMARKS: ${shell.marketBenchmarks.join(", ")}
NAV PATTERN: ${shell.navPattern}
IA RATIONALE: ${shell.iaRationale}

PRIMARY NAV
${shell.primaryNav.map((n) => `- ${n.label} → ${n.screenId || n.panel || n.id}`).join("\n")}

FOOTER COLUMNS
${shell.footer.columns.map((c) => `${c.title}: ${c.links.map((l) => l.label).join(", ")}`).join("\n")}

DISCLAIMERS
${shell.footer.disclaimers.map((d) => `- ${d}`).join("\n")}

ROLES
${roles.map((r, i) => `${i + 1}) ${r.label} (${r.id}) — ${r.description}`).join("\n")}

MODULES (${def.modules.length})
${def.modules.map((m) => `- ${m.title}: ${m.description}`).join("\n")}

WORKFLOWS
${workflows.map((w) => `- ${w.name} [${w.roleId}]: ${w.steps.join(" → ")} · ${w.description}`).join("\n")}

DATA
${entities.map((e) => `${e.name}: ${e.fields.map((f) => f.key).join(", ")} · statuses ${(e.statuses || []).join("/")}`).join("\n")}

FAQS
${learning.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n")}

SUCCESS
Production-style chrome: industry nav, multi-column footer, legal panels.
Role selector changes modules. Create records, move board statuses, happy/fail paths.
Content matches industry + Verlin educational standards. Not a joke shell.`;

  return {
    version: 1,
    brandName: def.brandName,
    tagline: def.tagline,
    description: def.description,
    rewrittenPrompt,
    primaryColor: "#0f2744",
    accentColor: "#0d9488",
    productKind: def.productKind,
    roles,
    entities,
    screens,
    workflows,
    shell,
    learning: {
      heroHeadline: learning.heroHeadline,
      heroSub: learning.heroSub,
      whoItsFor: learning.whoItsFor,
      outcomes: learning.outcomes,
      howItWorks: learning.howItWorks,
      trustLines: [...(learning.trustLines || []), ...shell.footer.trustBadges.slice(0, 2)],
      faqs: learning.faqs,
    },
    research: {
      summary: def.description,
      targetUsers: roles.map((r) => r.label),
      coreWorkflows: workflows.map((w) => ({ name: w.name, steps: w.steps })),
      screens: screens.map((s) => s.title),
      dataEntities: entities.map((e) => e.name),
      techNotes: [
        "Verlin UI",
        "Industry-standard product shell (nav + footer)",
        `Nav pattern: ${shell.navPattern}`,
        `Benchmarks: ${shell.marketBenchmarks.join(", ")}`,
        "Mock local state + educational content pack",
      ],
      competitors: [
        ...def.examples.map((name) => ({
          name,
          takeaway: `Parity module inspired by ${name}`,
        })),
        ...shell.marketBenchmarks.map((name) => ({
          name,
          takeaway: `IA / navigation benchmark for ${shell.navPattern}`,
        })),
      ],
      rewrittenPrompt,
    },
  };
}

export function getAllDemoSpecs(): Array<{ slug: string; def: DemoCategoryDef; spec: StudioAppSpec }> {
  assertFiftyCategories();
  return DEMO_CATEGORIES.map((def) => ({
    slug: def.slug,
    def,
    spec: buildDemoAppSpec(def),
  }));
}

export function getDemoSpecBySlug(slug: string): { def: DemoCategoryDef; spec: StudioAppSpec } | null {
  const def = getDemoCategory(slug);
  if (!def) return null;
  return { def, spec: buildDemoAppSpec(def) };
}

export { DEMO_CATEGORIES, getDemoCategory, assertFiftyCategories };
