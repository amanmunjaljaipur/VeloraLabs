/**
 * Build a full ForgeBuildPlan from prompt + discovery answers.
 * Wraps researchProductPlan and enriches with data models, roles, tech stack.
 */

import { researchProductPlan } from "@/lib/app-builder/research-plan";
import type { AppLlmSecrets } from "@/lib/app-builder/types";
import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";
import { classifyProductIdea } from "@/lib/forge/archetypes";
import type {
  DiscoveryAnswer,
  ForgeAssumption,
  ForgeBuildPlan,
  ForgeDataModel,
  ForgeFeature,
  ForgeIntegration,
  ForgeRole,
  ForgeScreen,
  ForgeTechStack,
  ProductArchetype,
} from "@/lib/forge/types";
import { forgeAnswersToInterview } from "@/lib/forge/types";

const DEFAULT_STACK: ForgeTechStack = {
  frontend: "Next.js + React (hosted on Verlin Labs)",
  backend: "Next.js API routes",
  database: "Blob-backed structured data (JSON models)",
  auth: "Per-app login with role-based access",
  hosting: "Verlin Labs multi-tenant hosting (/apps/{slug})",
  justification:
    "Modern, buildable stack that ships a working product without the user managing servers.",
};

function defaultRoles(archetype: ProductArchetype): ForgeRole[] {
  if (archetype === "booking") {
    return [
      {
        id: "owner",
        name: "Studio owner",
        description: "Manages classes, staff, and settings",
        permissions: ["manage schedule", "manage instructors", "view all bookings", "settings"],
      },
      {
        id: "instructor",
        name: "Instructor",
        description: "Sees their classes and attendance",
        permissions: ["view own classes", "mark attendance"],
      },
      {
        id: "member",
        name: "Member / guest",
        description: "Books and manages their own sessions",
        permissions: ["browse classes", "book", "cancel own", "view membership"],
      },
    ];
  }
  if (archetype === "tracker") {
    return [
      {
        id: "employee",
        name: "Employee",
        description: "Submits their own records",
        permissions: ["create own", "view own", "upload files"],
      },
      {
        id: "manager",
        name: "Manager",
        description: "Approves team submissions",
        permissions: ["approve team", "view team", "comment"],
      },
      {
        id: "admin",
        name: "Admin / finance",
        description: "Full access and reports",
        permissions: ["view all", "export", "manage categories", "settings"],
      },
    ];
  }
  if (archetype === "marketplace") {
    return [
      {
        id: "buyer",
        name: "Buyer",
        description: "Browses and purchases",
        permissions: ["browse", "buy", "message sellers", "review"],
      },
      {
        id: "seller",
        name: "Seller",
        description: "Lists and fulfills",
        permissions: ["list items", "manage orders", "message buyers"],
      },
      {
        id: "admin",
        name: "Platform admin",
        description: "Moderates the marketplace",
        permissions: ["moderate listings", "manage users", "settings"],
      },
    ];
  }
  if (archetype === "ecommerce") {
    return [
      {
        id: "customer",
        name: "Customer",
        description: "Browses and orders",
        permissions: ["browse", "order", "contact shop"],
      },
      {
        id: "owner",
        name: "Shop owner",
        description: "Runs the catalogue and orders",
        permissions: ["manage products", "manage orders", "CRM", "settings"],
      },
    ];
  }
  return [
    {
      id: "user",
      name: "User",
      description: "Primary person using the product",
      permissions: ["use core features", "manage own data"],
    },
    {
      id: "admin",
      name: "Admin",
      description: "Configures and oversees the product",
      permissions: ["manage users", "settings", "view reports"],
    },
  ];
}

function defaultModels(archetype: ProductArchetype): ForgeDataModel[] {
  if (archetype === "booking") {
    return [
      {
        id: "class",
        name: "Class / Session",
        description: "Bookable time slots",
        fields: [
          { name: "title", type: "string", required: true },
          { name: "startsAt", type: "datetime", required: true },
          { name: "durationMins", type: "number", required: true },
          { name: "capacity", type: "number", required: true },
          { name: "instructorId", type: "relation", ref: "Instructor" },
          { name: "price", type: "money" },
        ],
        relationships: ["Class → Instructor", "Class → many Bookings"],
      },
      {
        id: "booking",
        name: "Booking",
        fields: [
          { name: "userId", type: "relation", ref: "User", required: true },
          { name: "classId", type: "relation", ref: "Class", required: true },
          { name: "status", type: "enum", required: true },
          { name: "paid", type: "boolean" },
        ],
        relationships: ["Booking → User", "Booking → Class"],
      },
      {
        id: "membership",
        name: "Membership",
        fields: [
          { name: "userId", type: "relation", ref: "User", required: true },
          { name: "plan", type: "string", required: true },
          { name: "validUntil", type: "date" },
        ],
        relationships: ["Membership → User"],
      },
    ];
  }
  if (archetype === "tracker") {
    return [
      {
        id: "expense",
        name: "Expense",
        fields: [
          { name: "amount", type: "money", required: true },
          { name: "category", type: "string", required: true },
          { name: "date", type: "date", required: true },
          { name: "note", type: "text" },
          { name: "receiptUrl", type: "file" },
          { name: "status", type: "enum", required: true },
          { name: "submitterId", type: "relation", ref: "User", required: true },
        ],
        relationships: ["Expense → User (submitter)", "Expense → Approvals"],
      },
      {
        id: "approval",
        name: "Approval",
        fields: [
          { name: "expenseId", type: "relation", ref: "Expense", required: true },
          { name: "approverId", type: "relation", ref: "User", required: true },
          { name: "decision", type: "enum", required: true },
          { name: "comment", type: "text" },
        ],
        relationships: ["Approval → Expense", "Approval → User"],
      },
    ];
  }
  if (archetype === "ecommerce" || archetype === "marketplace") {
    return [
      {
        id: "product",
        name: "Product",
        fields: [
          { name: "name", type: "string", required: true },
          { name: "description", type: "text" },
          { name: "price", type: "money", required: true },
          { name: "category", type: "string" },
          { name: "imageUrl", type: "image" },
        ],
        relationships: ["Product → many OrderItems"],
      },
      {
        id: "order",
        name: "Order",
        fields: [
          { name: "customerId", type: "relation", ref: "User" },
          { name: "status", type: "enum", required: true },
          { name: "total", type: "money", required: true },
          { name: "channel", type: "string" },
        ],
        relationships: ["Order → User", "Order → OrderItems"],
      },
    ];
  }
  return [
    {
      id: "record",
      name: "Core record",
      fields: [
        { name: "title", type: "string", required: true },
        { name: "status", type: "enum" },
        { name: "ownerId", type: "relation", ref: "User" },
        { name: "createdAt", type: "datetime" },
      ],
      relationships: ["Record → User"],
    },
  ];
}

function defaultIntegrations(archetype: ProductArchetype): ForgeIntegration[] {
  const base: ForgeIntegration[] = [
    {
      id: "email",
      name: "Email notifications",
      purpose: "Confirmations and updates",
      required: false,
    },
  ];
  if (archetype === "booking" || archetype === "ecommerce" || archetype === "marketplace") {
    base.push({
      id: "payments",
      name: "Payments (UPI / card)",
      purpose: "Collect money online",
      required: false,
    });
  }
  if (archetype === "ecommerce") {
    base.push({
      id: "whatsapp",
      name: "WhatsApp",
      purpose: "Order and support chat",
      required: false,
    });
  }
  return base;
}

function screensFromProductPlan(
  pages: Array<{
    path: string;
    title: string;
    purpose: string;
    sections: string[];
    zone: string;
  }>,
  modules: Array<{
    id: string;
    title: string;
    purpose: string;
    zone: string;
  }>
): ForgeScreen[] {
  const fromPages: ForgeScreen[] = pages.map((p, i) => ({
    id: `page_${p.path || i}`,
    path: p.path,
    title: p.title,
    purpose: p.purpose,
    zone: p.zone === "authenticated" ? "authenticated" : "public",
    sections: p.sections || [],
  }));
  const fromMods: ForgeScreen[] = modules.map((m) => ({
    id: m.id,
    path: m.id,
    title: m.title,
    purpose: m.purpose,
    zone: "authenticated",
    sections: ["Main view", "Empty state", "Success"],
  }));
  // Dedup by path
  const seen = new Set<string>();
  const out: ForgeScreen[] = [];
  for (const s of [...fromPages, ...fromMods]) {
    const key = `${s.zone}:${s.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function assumptionsFromAnswers(answers: DiscoveryAnswer[]): ForgeAssumption[] {
  return answers
    .filter((a) => a.usedDefault && a.answer.trim())
    .map((a, i) => ({
      id: `def_${a.questionId || i}`,
      text: `${a.question} → ${a.answer}`,
      fromDefault: true,
    }));
}

export async function buildForgePlan(input: {
  prompt: string;
  answers?: DiscoveryAnswer[];
  customPoints?: string[];
  secrets?: AppLlmSecrets | null;
}): Promise<{ plan: ForgeBuildPlan; source: string }> {
  const prompt = input.prompt.trim();
  const classification = classifyProductIdea(prompt);
  const answers = input.answers || [];
  const interview = forgeAnswersToInterview(answers);

  const { plan: productPlan, source } = await researchProductPlan({
    prompt,
    answers: interview,
    customPoints: input.customPoints,
    secrets: input.secrets,
  });

  let roles = defaultRoles(classification.archetype);
  let dataModels = defaultModels(classification.archetype);
  let techStack = { ...DEFAULT_STACK };
  let integrations = defaultIntegrations(classification.archetype);
  let features: ForgeFeature[] = productPlan.features.map((f) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    priority: f.priority,
  }));

  const secrets = input.secrets?.apiKey?.trim()
    ? input.secrets
    : resolveAppBuilderSecrets();

  if (secrets) {
    try {
      const raw = await callUserLlm({
        secrets,
        temperature: 0.3,
        maxTokens: 3500,
        timeoutMs: 60_000,
        messages: [
          {
            role: "system",
            content: `You enrich a product build plan with roles, data models, features, integrations.
Return ONLY JSON:
{
  "roles": [{ "id", "name", "description", "permissions": string[] }],
  "dataModels": [{ "id", "name", "description?", "fields": [{ "name", "type", "required?", "ref?" }], "relationships": string[] }],
  "features": [{ "id", "title", "description", "priority": "must"|"should"|"could" }],
  "integrations": [{ "id", "name", "purpose", "required": boolean }],
  "techStack": { "frontend", "backend", "database", "auth", "hosting", "justification" },
  "extraAssumptions": string[]
}
Field types: string|text|number|boolean|date|datetime|enum|money|email|phone|url|image|file|relation|json.
Keep models practical for v1. Class-8 English.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              prompt,
              archetype: classification.archetype,
              domain: classification.domain,
              summary: productPlan.summary,
              features: productPlan.features,
              answers: interview,
              task: "Enrich plan sections for roles, data models, features, integrations.",
            }),
          },
        ],
      });

      const parsed = parseJsonObject<{
        roles?: ForgeRole[];
        dataModels?: ForgeDataModel[];
        features?: ForgeFeature[];
        integrations?: ForgeIntegration[];
        techStack?: Partial<ForgeTechStack>;
        extraAssumptions?: string[];
      }>(raw);

      if (Array.isArray(parsed.roles) && parsed.roles.length >= 1) roles = parsed.roles;
      if (Array.isArray(parsed.dataModels) && parsed.dataModels.length >= 1)
        dataModels = parsed.dataModels;
      if (Array.isArray(parsed.features) && parsed.features.length >= 2)
        features = parsed.features.map((f, i) => ({
          id: f.id || `f${i + 1}`,
          title: f.title,
          description: f.description || "",
          priority: f.priority === "should" || f.priority === "could" ? f.priority : "must",
        }));
      if (Array.isArray(parsed.integrations)) integrations = parsed.integrations;
      if (parsed.techStack) techStack = { ...techStack, ...parsed.techStack };

      const extra = (parsed.extraAssumptions || []).map((t, i) => ({
        id: `llm_a_${i}`,
        text: t,
        fromDefault: true,
      }));

      const plan = assemblePlan({
        productPlan,
        classification,
        roles,
        dataModels,
        features,
        integrations,
        techStack,
        answerAssumptions: assumptionsFromAnswers(answers),
        extraAssumptions: extra,
        source: `${source}+forge-enrich`,
      });
      return { plan, source: plan.researchSource };
    } catch (e) {
      console.error("[forge/plan enrich]", e);
    }
  }

  const plan = assemblePlan({
    productPlan,
    classification,
    roles,
    dataModels,
    features,
    integrations,
    techStack,
    answerAssumptions: assumptionsFromAnswers(answers),
    extraAssumptions: [
      {
        id: "v1_demo",
        text: "v1 is a working hosted product with realistic sample data; some advanced integrations may be mocked.",
        fromDefault: true,
      },
    ],
    source: `${source}+forge-scaffold`,
  });

  return { plan, source: plan.researchSource };
}

function assemblePlan(input: {
  productPlan: Awaited<ReturnType<typeof researchProductPlan>>["plan"];
  classification: ReturnType<typeof classifyProductIdea>;
  roles: ForgeRole[];
  dataModels: ForgeDataModel[];
  features: ForgeFeature[];
  integrations: ForgeIntegration[];
  techStack: ForgeTechStack;
  answerAssumptions: ForgeAssumption[];
  extraAssumptions: ForgeAssumption[];
  source: string;
}): ForgeBuildPlan {
  const { productPlan: pp, classification } = input;
  const assumptions = [
    ...input.answerAssumptions,
    ...input.extraAssumptions,
    ...pp.assumptions.map((t, i) => ({
      id: `pp_a_${i}`,
      text: t,
      fromDefault: false,
    })),
  ];
  // de-dupe assumption text
  const seen = new Set<string>();
  const uniqueAssumptions = assumptions.filter((a) => {
    const k = a.text.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return {
    version: 1,
    productSummary: pp.summary,
    brandName: pp.brandName,
    tagline: pp.tagline,
    archetype: classification.archetype,
    domain: classification.domain,
    extensionId: pp.extensionId || classification.extensionId,
    appKind: pp.appKind || classification.appKind,
    roles: input.roles,
    dataModels: input.dataModels,
    features: input.features,
    screens: screensFromProductPlan(pp.publicPages, pp.modules),
    techStack: input.techStack,
    integrations: input.integrations,
    assumptions: uniqueAssumptions,
    outOfScope: pp.outOfScope,
    businessModel: pp.businessModel,
    businessModelDetail: pp.businessModelDetail,
    region: pp.region,
    audience: pp.audience,
    valueProp: pp.valueProp,
    trustCompliance: pp.trustCompliance,
    researchedAt: new Date().toISOString(),
    researchSource: input.source,
  };
}
