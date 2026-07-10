/**
 * Split src/lib/demo-apps/categories.ts into groups/*.ts folders for deploy clarity.
 */
import fs from "fs";
import path from "path";

const root = "src/lib/demo-apps";
const src = fs.readFileSync(path.join(root, "categories.ts"), "utf8");

const types = `/**
 * Shared types and helpers for demo app category definitions.
 * Group files live under ./groups/<domain>/ for easy deploy units.
 */

export type DemoGroupId =
  | "social"
  | "entertainment"
  | "fintech"
  | "ecommerce"
  | "utilities"
  | "productivity"
  | "education"
  | "health"
  | "travel";

export type DemoCategoryDef = {
  slug: string;
  name: string;
  group: DemoGroupId;
  groupLabel: string;
  tagline: string;
  description: string;
  examples: string[];
  productKind: "banking" | "resume" | "booking" | "expense" | "crm" | "tasks" | "generic";
  brandName: string;
  roles: Array<{
    id: string;
    label: string;
    description: string;
    canCreate?: boolean;
    canManage?: boolean;
    isDefault?: boolean;
  }>;
  entities: Array<{
    id: string;
    name: string;
    namePlural: string;
    statuses: string[];
    fields: Array<{
      key: string;
      label: string;
      type: "text" | "textarea" | "number" | "select" | "status" | "email" | "phone" | "date";
      options?: string[];
      required?: boolean;
    }>;
    seeds: Array<Record<string, unknown>>;
  }>;
  modules: Array<{
    id: string;
    title: string;
    type: "dashboard" | "list" | "form" | "board" | "schedule" | "settings" | "workspace" | "transfer";
    entityId?: string;
    roleIds?: string[];
    description: string;
  }>;
  workflows: Array<{
    id: string;
    name: string;
    description: string;
    roleId: string;
    steps: string[];
    moduleId: string;
    entityId?: string;
  }>;
};

export const DEMO_GROUP_LABELS: Record<DemoGroupId, string> = {
  social: "1. Social & Communication",
  entertainment: "2. Entertainment, Media & Streaming",
  fintech: "3. Fintech, Digital Banking & Finance",
  ecommerce: "4. E-Commerce & Retail Services",
  utilities: "5. Utilities, Systems & Security",
  productivity: "6. Productivity & Workplace",
  education: "7. Education & Self-Improvement",
  health: "8. Health, Fitness & Lifestyle",
  travel: "9. Travel, Transport & Local",
};

export const DEMO_GROUP_ORDER: DemoGroupId[] = [
  "social",
  "entertainment",
  "fintech",
  "ecommerce",
  "utilities",
  "productivity",
  "education",
  "health",
  "travel",
];

/** Helper to build entity definitions for category blueprints. */
export function ent(
  id: string,
  name: string,
  statuses: string[],
  fieldKeys: string[],
  seeds: Array<Record<string, unknown>>
): DemoCategoryDef["entities"][0] {
  const fields: DemoCategoryDef["entities"][0]["fields"] = fieldKeys.map((k) => {
    if (k === "status") return { key: "status", label: "Status", type: "status" as const };
    if (k === "amount" || k === "price" || k === "calories" || k === "score" || k === "qty")
      return { key: k, label: k[0].toUpperCase() + k.slice(1), type: "number" as const };
    if (k === "description" || k === "notes" || k === "body" || k === "summary")
      return { key: k, label: k[0].toUpperCase() + k.slice(1), type: "textarea" as const };
    if (k === "email") return { key: "email", label: "Email", type: "email" as const };
    if (k === "phone") return { key: "phone", label: "Phone", type: "phone" as const };
    return {
      key: k,
      label: k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
      type: "text" as const,
      required: k === "title" || k === "name",
    };
  });
  return {
    id,
    name,
    namePlural: name.endsWith("s") ? name : \`\${name}s\`,
    statuses,
    fields,
    seeds: seeds.map((s) => ({ ...s })),
  };
}
`;

const groups = [
  "social",
  "entertainment",
  "fintech",
  "ecommerce",
  "utilities",
  "productivity",
  "education",
  "health",
  "travel",
];

const groupStarts = {
  social: src.indexOf("// —— 1. Social"),
  entertainment: src.indexOf("// —— 2. Entertainment"),
  fintech: src.indexOf("// —— 3. Fintech"),
  ecommerce: src.indexOf("// —— 4. E-commerce"),
  utilities: src.indexOf("// —— 5. Utilities"),
  productivity: src.indexOf("// —— 6. Productivity"),
  education: src.indexOf("// —— 7. Education"),
  health: src.indexOf("// —— 8. Health"),
  travel: src.indexOf("// —— 9. Travel"),
};

const arrayEnd = src.lastIndexOf("];", src.indexOf("export const DEMO_GROUP_ORDER"));
if (arrayEnd < 0) throw new Error("array end not found");

fs.mkdirSync(path.join(root, "groups"), { recursive: true });
fs.writeFileSync(path.join(root, "types.ts"), types);

for (let i = 0; i < groups.length; i++) {
  const g = groups[i];
  const start = groupStarts[g];
  const end = i + 1 < groups.length ? groupStarts[groups[i + 1]] : arrayEnd;
  if (start < 0) throw new Error("missing group " + g);
  const chunk = src.slice(start, end).trim();
  const firstBrace = chunk.indexOf("{");
  let items = chunk.slice(firstBrace).replace(/,\s*$/, "");

  // groupLabel: G.social → groupLabel: G.social still works if G = DEMO_GROUP_LABELS
  const dir = path.join(root, "groups", g);
  fs.mkdirSync(dir, { recursive: true });

  const file = `/**
 * Demo app categories: ${g}
 * Deploy unit: src/lib/demo-apps/groups/${g}/
 */

import { ent, type DemoCategoryDef, DEMO_GROUP_LABELS } from "../../types";

const G = DEMO_GROUP_LABELS;

export const CATEGORIES: DemoCategoryDef[] = [
${items}
];

export default CATEGORIES;
`;
  fs.writeFileSync(path.join(dir, "index.ts"), file);
  console.log("wrote groups/" + g + "/index.ts", file.length, "bytes");
}

const index = `/**
 * Demo apps catalog — re-exports all 50 categories from deployable group folders.
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

export type { DemoCategoryDef, DemoGroupId } from "./types";
export { DEMO_GROUP_LABELS, DEMO_GROUP_ORDER, ent } from "./types";

export const DEMO_CATEGORIES: DemoCategoryDef[] = [
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

export function getDemoCategory(slug: string): DemoCategoryDef | undefined {
  return DEMO_CATEGORIES.find((c) => c.slug === slug);
}

export function assertFiftyCategories(): void {
  if (DEMO_CATEGORIES.length !== 50) {
    throw new Error(\`Expected 50 demo categories, got \${DEMO_CATEGORIES.length}\`);
  }
  const slugs = new Set(DEMO_CATEGORIES.map((c) => c.slug));
  if (slugs.size !== 50) {
    throw new Error("Duplicate demo category slugs");
  }
}

export function getCategoriesByGroup(group: DemoGroupId): DemoCategoryDef[] {
  return DEMO_CATEGORIES.filter((c) => c.group === group);
}
`;

fs.writeFileSync(path.join(root, "index.ts"), index);

// Rewrite categories.ts as re-export shim for old imports
const shim = `/**
 * @deprecated Import from "@/lib/demo-apps" or "@/lib/demo-apps/groups/<name>" instead.
 * Kept as a thin re-export so existing imports keep working.
 */
export {
  DEMO_CATEGORIES,
  DEMO_GROUP_ORDER,
  DEMO_GROUP_LABELS,
  getDemoCategory,
  assertFiftyCategories,
  getCategoriesByGroup,
  ent,
  type DemoCategoryDef,
  type DemoGroupId,
} from "./index";
`;
fs.writeFileSync(path.join(root, "categories.ts"), shim);

console.log("Done. Categories:", "check with test script");
