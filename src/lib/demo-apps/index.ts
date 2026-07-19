/**
 * Demo apps catalog - re-exports all 50 categories from deployable group folders.
 *
 * Layout:
 *   types.ts
 *   groups/<domain>/index.ts   ← one folder per vertical family
 *   build-demo-spec.ts
 *   index.ts                   ← this file
 */

import { CATEGORIES as social } from "./groups/social";
import { CATEGORIES as entertainment } from "./groups/entertainment";
import { CATEGORIES as fintech } from "./groups/fintech";
import { CATEGORIES as ecommerce } from "./groups/ecommerce";
import { CATEGORIES as utilities } from "./groups/utilities";
import { CATEGORIES as productivity } from "./groups/productivity";
import { CATEGORIES as education } from "./groups/education";
import { CATEGORIES as health } from "./groups/health";
import { CATEGORIES as travel } from "./groups/travel";
import type { DemoCategoryDef, DemoGroupId } from "./types";
import { premiumizeDemoCategory } from "./premiumize";

export type { DemoCategoryDef, DemoGroupId, DemoLearningContent } from "./types";
export { DEMO_GROUP_LABELS, DEMO_GROUP_ORDER, ent } from "./types";
export { premiumizeDemoCategory, premiumizeAll } from "./premiumize";
export { getLearningPack, DEMO_LEARNING_PACKS } from "./learning-content";
export { resolveIndustryShell, panelContent } from "./industry-shells";
export { ensureIndustryRoles } from "./industry-roles";

const RAW_CATEGORIES: DemoCategoryDef[] = [
  ...social,
  ...entertainment,
  ...fintech,
  ...ecommerce,
  ...utilities,
  ...productivity,
  ...education,
  ...health,
  ...travel,
];

/** All 50 categories with Verlin educational content applied. */
export const DEMO_CATEGORIES: DemoCategoryDef[] = RAW_CATEGORIES.map(premiumizeDemoCategory);

export function getDemoCategory(slug: string): DemoCategoryDef | undefined {
  return DEMO_CATEGORIES.find((c) => c.slug === slug);
}

export function getRawDemoCategory(slug: string): DemoCategoryDef | undefined {
  return RAW_CATEGORIES.find((c) => c.slug === slug);
}

export function assertFiftyCategories(): void {
  if (DEMO_CATEGORIES.length !== 50) {
    throw new Error(`Expected 50 demo categories, got ${DEMO_CATEGORIES.length}`);
  }
  const slugs = new Set(DEMO_CATEGORIES.map((c) => c.slug));
  if (slugs.size !== 50) {
    throw new Error("Duplicate demo category slugs");
  }
}

export function getCategoriesByGroup(group: DemoGroupId): DemoCategoryDef[] {
  return DEMO_CATEGORIES.filter((c) => c.group === group);
}
