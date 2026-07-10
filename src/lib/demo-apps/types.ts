/**
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
    namePlural: name.endsWith("s") ? name : `${name}s`,
    statuses,
    fields,
    seeds: seeds.map((s) => ({ ...s })),
  };
}
