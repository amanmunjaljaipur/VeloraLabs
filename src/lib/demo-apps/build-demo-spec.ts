/**
 * Convert DemoCategoryDef → full StudioAppSpec (roles, entities, screens, workflows).
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
} from "@/lib/demo-apps/categories";

export function buildDemoAppSpec(def: DemoCategoryDef): StudioAppSpec {
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

  const rewrittenPrompt = `Build a complete multi-role product for category "${def.name}" named ${def.brandName}.

SUMMARY
${def.description}

EXAMPLES IN MARKET: ${def.examples.join(", ")}

ROLES
${roles.map((r, i) => `${i + 1}) ${r.label} (${r.id}) — ${r.description}`).join("\n")}

MODULES (${def.modules.length})
${def.modules.map((m) => `- ${m.title}: ${m.description}`).join("\n")}

WORKFLOWS
${workflows.map((w) => `- ${w.name} [${w.roleId}]: ${w.steps.join(" → ")}`).join("\n")}

DATA
${entities.map((e) => `${e.name}: ${e.fields.map((f) => f.key).join(", ")} · statuses ${(e.statuses || []).join("/")}`).join("\n")}

SUCCESS
Role selector top-right changes modules. Create records, move board statuses, complete happy and fail paths. Verlin Labs UI theme. Not a marketing brochure.`;

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
    research: {
      summary: def.description,
      targetUsers: roles.map((r) => r.label),
      coreWorkflows: workflows.map((w) => ({ name: w.name, steps: w.steps })),
      screens: screens.map((s) => s.title),
      dataEntities: entities.map((e) => e.name),
      techNotes: ["Verlin UI", "Studio multi-module runtime", "Mock local state"],
      competitors: def.examples.map((name) => ({
        name,
        takeaway: `Parity module inspired by ${name}`,
      })),
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
