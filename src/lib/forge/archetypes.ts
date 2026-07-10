/**
 * Classify a free-text product idea into archetype + domain.
 * Used to drive adaptive discovery questions.
 */

import { detectVerticalFromPrompt } from "@/lib/app-builder/detect-vertical";
import type { ForgeDomain, ProductArchetype } from "@/lib/forge/types";

export type Classification = {
  archetype: ProductArchetype;
  domain: ForgeDomain;
  label: string;
  extensionId: string;
  appKind: string;
  confidence: "high" | "medium" | "low";
  /** Dimensions the interview should cover */
  dimensions: string[];
};

const ARCHETYPE_RULES: Array<{
  match: RegExp;
  archetype: ProductArchetype;
  dimensions: string[];
}> = [
  {
    match: /\b(marketplace|two[- ]sided|buyers? and sellers?|vendors?|multi[- ]vendor)\b/i,
    archetype: "marketplace",
    dimensions: [
      "roles",
      "listings",
      "transactions",
      "payments",
      "trust",
      "auth",
      "moderation",
    ],
  },
  {
    match: /\b(crm|pipeline|leads?|sales team|deal(s)?)\b/i,
    archetype: "crm",
    dimensions: ["roles", "entities", "pipeline", "auth", "notifications", "reporting"],
  },
  {
    match: /\b(book(ing)?|appointment|schedule|class(es)?|slot|reservation|yoga|salon|studio)\b/i,
    archetype: "booking",
    dimensions: [
      "roles",
      "schedule",
      "payments",
      "cancellation",
      "capacity",
      "auth",
      "notifications",
    ],
  },
  {
    match: /\b(shop|store|ecommerce|e-commerce|catalogue|catalog|products? to sell|kirana)\b/i,
    archetype: "ecommerce",
    dimensions: ["catalog", "orders", "payments", "fulfillment", "auth", "branding"],
  },
  {
    match: /\b(expense|tracker|logger|habit|timesheet|inventory log|mood)\b/i,
    archetype: "tracker",
    dimensions: ["entities", "workflow", "roles", "auth", "reporting", "uploads"],
  },
  {
    match: /\b(internal|for my team|intranet|ops tool|admin tool|employee)\b/i,
    archetype: "internal_tool",
    dimensions: ["roles", "workflow", "entities", "auth", "approvals", "reporting"],
  },
  {
    match: /\b(saas|dashboard|subscription product|b2b platform)\b/i,
    archetype: "saas_dashboard",
    dimensions: ["roles", "tenancy", "billing", "core_features", "auth", "integrations"],
  },
  {
    match: /\b(social|community|feed|follow|posts?|chat app)\b/i,
    archetype: "social_app",
    dimensions: ["roles", "content", "auth", "moderation", "notifications"],
  },
  {
    match: /\b(blog|content site|magazine|docs|knowledge base|wiki)\b/i,
    archetype: "content_site",
    dimensions: ["content_types", "roles", "seo", "auth", "branding"],
  },
  {
    match: /\b(bank|fintech|wallet|payments? app|insurance|loan)\b/i,
    archetype: "fintech",
    dimensions: ["roles", "accounts", "compliance", "auth", "transactions", "security"],
  },
  {
    match: /\b(tuition|course|learning|lms|students?|classroom)\b/i,
    archetype: "education",
    dimensions: ["roles", "content", "progress", "auth", "scheduling", "payments"],
  },
  {
    match: /\b(portfolio|personal brand|showcase)\b/i,
    archetype: "portfolio",
    dimensions: ["content", "branding", "contact", "projects"],
  },
];

const DOMAIN_RULES: Array<{ match: RegExp; domain: ForgeDomain }> = [
  { match: /\b(finance|expense|invoice|money|bank|pay|budget)\b/i, domain: "finance" },
  { match: /\b(health|clinic|doctor|patient|medical|wellness)\b/i, domain: "health" },
  { match: /\b(school|student|tuition|course|learn|exam)\b/i, domain: "education" },
  { match: /\b(travel|hotel|flight|trip|tour)\b/i, domain: "travel" },
  { match: /\b(shop|retail|store|fashion|goods)\b/i, domain: "retail" },
  { match: /\b(food|restaurant|cafe|recipe|kitchen)\b/i, domain: "food" },
  { match: /\b(yoga|fitness|gym|workout|studio)\b/i, domain: "fitness" },
  { match: /\b(resume|career|freelance|agency|consult)\b/i, domain: "professional" },
];

/** Map App Builder vertical → Forge archetype when rules miss */
function verticalToArchetype(appKind: string, extensionId: string): ProductArchetype {
  if (extensionId === "ecom-local-shop" || appKind === "ecom") return "ecommerce";
  if (extensionId === "booking-local" || appKind === "booking") return "booking";
  if (extensionId === "digital-banking") return "fintech";
  if (extensionId === "insurance") return "fintech";
  if (extensionId === "resume-career") return "portfolio";
  if (extensionId === "portfolio") return "portfolio";
  if (extensionId === "tuition-centre" || appKind === "tuition") return "education";
  return "custom";
}

export function classifyProductIdea(prompt: string): Classification {
  const text = prompt.trim();
  const vertical = detectVerticalFromPrompt(text);

  let archetype: ProductArchetype = verticalToArchetype(
    vertical.appKind,
    vertical.extensionId
  );
  let dimensions: string[] = [
    "users",
    "core_actions",
    "entities",
    "auth",
    "branding",
  ];
  let confidence: Classification["confidence"] = vertical.confidence;

  for (const rule of ARCHETYPE_RULES) {
    if (rule.match.test(text)) {
      archetype = rule.archetype;
      dimensions = rule.dimensions;
      confidence = "high";
      break;
    }
  }

  let domain: ForgeDomain = "general";
  for (const rule of DOMAIN_RULES) {
    if (rule.match.test(text)) {
      domain = rule.domain;
      break;
    }
  }

  // Domain-specific dimension boosts
  if (domain === "fitness" && archetype === "booking") {
    dimensions = [
      ...new Set([
        ...dimensions,
        "class_types",
        "instructors",
        "membership",
        "cancellation",
      ]),
    ];
  }
  if (domain === "finance" && archetype === "tracker") {
    dimensions = [
      ...new Set([...dimensions, "approvals", "categories", "receipts", "visibility"]),
    ];
  }

  const label =
    archetype === "custom"
      ? vertical.label
      : archetype.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    archetype,
    domain,
    label,
    extensionId: vertical.extensionId,
    appKind: vertical.appKind,
    confidence,
    dimensions,
  };
}

/** Example chips for intake screen */
export const FORGE_EXAMPLE_PROMPTS: Array<{
  id: string;
  label: string;
  prompt: string;
  emoji: string;
}> = [
  {
    id: "yoga",
    label: "Yoga studio booking",
    prompt:
      "A booking app for my yoga studio — members book classes, see instructors, and manage membership vs drop-in payments.",
    emoji: "🧘",
  },
  {
    id: "expense",
    label: "Team expense tracker",
    prompt:
      "An internal expense tracker for my team — submit expenses with receipts, manager approval, categories, and visibility by role.",
    emoji: "🧾",
  },
  {
    id: "market",
    label: "Handmade marketplace",
    prompt:
      "A marketplace for handmade goods where artisans list products and customers buy and message sellers.",
    emoji: "🎨",
  },
  {
    id: "crm",
    label: "Simple CRM",
    prompt:
      "A lightweight CRM for a small sales team to track leads, deals, and follow-ups.",
    emoji: "📇",
  },
  {
    id: "tuition",
    label: "Tuition centre",
    prompt:
      "An app for my tuition centre — batches, student attendance, fees, and parent updates.",
    emoji: "📚",
  },
  {
    id: "portfolio",
    label: "Freelance portfolio",
    prompt:
      "A personal portfolio site for a freelance designer with projects, about, and contact.",
    emoji: "✨",
  },
];
