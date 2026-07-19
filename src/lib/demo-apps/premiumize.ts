/**
 * Raise every demo category to Verlin Labs educational content quality.
 * Merges handcrafted learning packs + upgrades thin roles/modules/seeds/workflows.
 */

import {
  getLearningPack,
  isThinCopy,
  synthesizeLearningPack,
} from "./learning-content";
import { ensureIndustryRoles } from "./industry-roles";
import type { DemoCategoryDef, DemoLearningContent } from "./types";
import { getDemoAppImage, getPageDefaultImage } from "./demo-images";
import { readDemoAppCustomizations } from "./customizations-store";

function expandRoleDescription(
  role: DemoCategoryDef["roles"][0],
  pack: DemoLearningContent,
  brand: string
): string {
  if (pack.roleCopy?.[role.id] && !isThinCopy(pack.roleCopy[role.id], 8)) {
    return pack.roleCopy[role.id];
  }
  if (!isThinCopy(role.description, 10)) return role.description;
  const bits: string[] = [];
  if (role.isDefault) bits.push(`Default role in ${brand}.`);
  if (role.canCreate) bits.push("Can create records on open modules.");
  if (role.canManage) bits.push("Can change statuses and manage queues.");
  bits.push(role.description || `Works as ${role.label} across visible modules.`);
  return bits.join(" ");
}

function expandModuleDescription(
  mod: DemoCategoryDef["modules"][0],
  pack: DemoLearningContent
): string {
  if (pack.moduleCopy?.[mod.id] && !isThinCopy(pack.moduleCopy[mod.id], 6)) {
    return pack.moduleCopy[mod.id];
  }
  if (!isThinCopy(mod.description, 8)) return mod.description;
  const typeHint: Record<string, string> = {
    dashboard: "Overview of outcomes, counts, and next actions for this role.",
    list: "Scan records, open details, and update status when you finish a job.",
    board: "Kanban-style status lanes - drag work forward by changing status.",
    form: "Create a new record with validation. Titles with “fail” exercise error paths.",
    schedule: "Time-ordered work - what is due and what is done.",
    settings: "Preferences, policies, and role-aware configuration for this demo.",
    workspace: "Side-by-side editor and preview for document-style work.",
    transfer: "Multi-step money or handoff flow with validation.",
  };
  const base = typeHint[mod.type] || "Product module for this workflow.";
  return `${mod.description ? `${mod.description}. ` : ""}${base}`.trim();
}

function expandWorkflowDescription(
  wf: DemoCategoryDef["workflows"][0],
  roleLabel: string
): string {
  if (!isThinCopy(wf.description, 8)) return wf.description;
  return `As ${roleLabel}: ${wf.steps.join(" → ")}. Finish with a visible status or confirmation.`;
}

function enrichSeedRow(
  row: Record<string, unknown>,
  enrichment?: Partial<Record<string, unknown>>
): Record<string, unknown> {
  if (!enrichment) return { ...row };
  const next = { ...row };
  for (const [k, v] of Object.entries(enrichment)) {
    if (v === undefined) continue;
    const cur = next[k];
    // Prefer pack enrichment when existing copy is thin
    if (typeof v === "string" && typeof cur === "string") {
      if (isThinCopy(cur, 6) || v.length > cur.length) next[k] = v;
    } else if (cur === undefined || cur === null || cur === "") {
      next[k] = v;
    } else if (typeof v === "string" && isThinCopy(String(cur), 4)) {
      next[k] = v;
    }
  }
  // Ensure description-like fields are never empty stubs
  for (const key of ["description", "notes", "summary", "body"] as const) {
    if (key in next && isThinCopy(String(next[key] ?? ""), 4)) {
      const title = String(next.title || next.name || "Item");
      next[key] = `${title} - practice record for this demo. Update status when the job is done.`;
    }
  }
  return next;
}

/**
 * Apply Verlin educational content quality to a category definition.
 */
export function premiumizeDemoCategory(raw: DemoCategoryDef): DemoCategoryDef {
  // Industry multi-sided roles first (compliance, ops, parent, etc.)
  const def = ensureIndustryRoles(raw);

  let customOverride: any = null;
  // Apply customizations database overrides
  try {
    const overrides = readDemoAppCustomizations();
    const override = overrides[def.slug];
    if (override) {
      customOverride = override;
      if (override.name) def.name = override.name;
      if (override.brandName) def.brandName = override.brandName;
      if (override.tagline) def.tagline = override.tagline;
      if (override.description) def.description = override.description;
      if (override.imageUrl) def.imageUrl = override.imageUrl;
      if (override.primaryColor) def.primaryColor = override.primaryColor;
      if (override.accentColor) def.accentColor = override.accentColor;
      if (override.footerColumns) def.footerColumns = override.footerColumns;
      if (override.outcomes && def.learning) {
        def.learning.outcomes = override.outcomes;
      }
    }
  } catch (err) {
    console.error("Failed to load demo customizations in premiumize", err);
  }

  const pack: DemoLearningContent =
    def.learning || getLearningPack(def.slug) || synthesizeLearningPack(def);

  const roles = def.roles.map((r) => ({
    ...r,
    description: expandRoleDescription(r, pack, def.brandName),
  }));

  const modules = def.modules.map((m) => {
    const screenOverride = customOverride?.screens?.[m.id];
    return {
      ...m,
      title: screenOverride?.title || m.title,
      description: screenOverride?.description || expandModuleDescription(m, pack),
      imageUrl: screenOverride?.imageUrl || getPageDefaultImage(m.id || m.title || "", def.imageUrl),
    };
  });

  const roleLabel = (id: string) => roles.find((r) => r.id === id)?.label || id;

  const workflows = def.workflows.map((w) => ({
    ...w,
    description: expandWorkflowDescription(w, roleLabel(w.roleId)),
    name: isThinCopy(w.name, 2) ? `${roleLabel(w.roleId)} · ${w.name}` : w.name,
  }));

  const entities = def.entities.map((entity) => {
    const customSeeds = customOverride?.entities?.[entity.id]?.seeds;
    const baseSeeds = customSeeds || entity.seeds;
    const enrichList = pack.seedEnrichment?.[entity.id] || [];
    const seeds = baseSeeds.map((row: any, i: number) => enrichSeedRow(row, enrichList[i]));
    const upgraded = seeds.map((row: any, i: number) => {
      const customRow = baseSeeds[i];
      const title = String(row.title || row.name || "");
      const finalTitle = title && isThinCopy(title, 2) ? `${entity.name}: ${title}` : title;
      return {
        ...row,
        title: finalTitle,
        imageUrl: customRow?.imageUrl || row.imageUrl || getPageDefaultImage(entity.id || "", def.imageUrl),
      };
    });
    return { ...entity, seeds: upgraded };
  });

  return {
    ...def,
    imageUrl: def.imageUrl || getDemoAppImage(def.slug),
    tagline: pack.tagline,
    description: pack.description,
    learning: pack,
    roles,
    modules,
    workflows,
    entities,
  };
}

export function premiumizeAll(categories: DemoCategoryDef[]): DemoCategoryDef[] {
  return categories.map(premiumizeDemoCategory);
}
