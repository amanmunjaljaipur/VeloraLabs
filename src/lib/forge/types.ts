/**
 * Forge — AI Product Builder with Discovery.
 * Stage model + editable build plan used across UI and APIs.
 */

import type { AppExtensionId, AppInterviewAnswer, InterviewQuestion } from "@/lib/app-builder/types";
import type { ProductPlan } from "@/lib/app-builder/product-plan-types";

export type ForgeStage =
  | "intake"
  | "discovery"
  | "plan"
  | "build"
  | "preview";

export type ProductArchetype =
  | "marketplace"
  | "internal_tool"
  | "saas_dashboard"
  | "social_app"
  | "booking"
  | "ecommerce"
  | "crm"
  | "content_site"
  | "tracker"
  | "fintech"
  | "education"
  | "portfolio"
  | "custom";

export type ForgeDomain =
  | "finance"
  | "health"
  | "education"
  | "travel"
  | "retail"
  | "food"
  | "fitness"
  | "professional"
  | "general";

export type FieldType =
  | "string"
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "enum"
  | "money"
  | "email"
  | "phone"
  | "url"
  | "image"
  | "file"
  | "relation"
  | "json";

export type ForgeDataField = {
  name: string;
  type: FieldType | string;
  required?: boolean;
  /** Relation target entity name when type is relation */
  ref?: string;
  description?: string;
};

export type ForgeDataModel = {
  id: string;
  name: string;
  description?: string;
  fields: ForgeDataField[];
  /** Human-readable relationship notes */
  relationships: string[];
};

export type ForgeRole = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};

export type ForgeFeature = {
  id: string;
  title: string;
  description: string;
  priority: "must" | "should" | "could";
  module?: string;
};

export type ForgeScreen = {
  id: string;
  path: string;
  title: string;
  purpose: string;
  zone: "public" | "authenticated";
  sections: string[];
};

export type ForgeTechStack = {
  frontend: string;
  backend: string;
  database: string;
  auth: string;
  hosting: string;
  justification: string;
};

export type ForgeIntegration = {
  id: string;
  name: string;
  purpose: string;
  required: boolean;
};

export type ForgeAssumption = {
  id: string;
  text: string;
  /** true when AI filled this without user input */
  fromDefault: boolean;
};

/** Full editable build plan shown on the Plan Canvas */
export type ForgeBuildPlan = {
  version: 1;
  productSummary: string;
  brandName: string;
  tagline: string;
  archetype: ProductArchetype;
  domain: ForgeDomain;
  extensionId: AppExtensionId | string;
  appKind: string;
  roles: ForgeRole[];
  dataModels: ForgeDataModel[];
  features: ForgeFeature[];
  screens: ForgeScreen[];
  techStack: ForgeTechStack;
  integrations: ForgeIntegration[];
  assumptions: ForgeAssumption[];
  outOfScope: string[];
  /** Legacy ProductPlan fields kept for generate pipeline */
  businessModel: string;
  businessModelDetail: string;
  region: string;
  audience: string[];
  valueProp: string;
  trustCompliance: string[];
  researchedAt: string;
  researchSource: string;
};

export type DiscoveryAnswer = {
  questionId: string;
  question: string;
  answer: string;
  /** true when user chose "smart default" */
  usedDefault?: boolean;
  skipped?: boolean;
};

export type DiscoveryBatch = {
  batchIndex: number;
  questions: InterviewQuestion[];
  /** Soft progress 0–100 toward enough signal for a plan */
  progress: number;
  /** When true, stop interviewing and generate plan */
  complete: boolean;
  rationale?: string;
  archetype: ProductArchetype;
  domain: ForgeDomain;
  understanding: string;
  designedBy: string;
};

export type ForgeProjectDraft = {
  id: string;
  stage: ForgeStage;
  prompt: string;
  archetype?: ProductArchetype;
  domain?: ForgeDomain;
  understanding?: string;
  answers: DiscoveryAnswer[];
  batchesAsked: number;
  plan: ForgeBuildPlan | null;
  planVersion: number;
  planHistory: Array<{ version: number; at: string; note: string; plan: ForgeBuildPlan }>;
  /** Linked App Builder project after build */
  appProjectId?: string;
  appSlug?: string;
  publicUrl?: string;
  buildSteps?: Array<{ id: string; label: string; status: "pending" | "running" | "done" | "error" }>;
  updatedAt: string;
  createdAt: string;
};

export function forgeAnswersToInterview(
  answers: DiscoveryAnswer[]
): AppInterviewAnswer[] {
  return answers
    .filter((a) => a.answer.trim() && !a.skipped)
    .map((a) => ({
      id: a.questionId,
      question: a.question,
      answer: a.answer,
    }));
}

export function forgePlanToProductPlan(plan: ForgeBuildPlan): ProductPlan {
  return {
    version: 1,
    brandName: plan.brandName,
    tagline: plan.tagline,
    businessModel: plan.businessModel,
    businessModelDetail: plan.businessModelDetail,
    region: plan.region,
    audience: plan.audience,
    valueProp: plan.valueProp,
    extensionId: plan.extensionId,
    appKind: plan.appKind,
    summary: plan.productSummary,
    publicPages: plan.screens
      .filter((s) => s.zone === "public")
      .map((s) => ({
        path: s.path,
        title: s.title,
        purpose: s.purpose,
        sections: s.sections,
        zone: "public" as const,
      })),
    modules: plan.screens
      .filter((s) => s.zone === "authenticated")
      .map((s) => ({
        id: s.id,
        title: s.title,
        purpose: s.purpose,
        states: ["empty", "loading", "success", "error"],
        behaviors: plan.features
          .filter((f) => f.module === s.id || f.priority === "must")
          .slice(0, 4)
          .map((f) => f.title),
        zone: "authenticated" as const,
      })),
    personas: plan.roles.map((r) => ({
      name: r.name,
      goal: r.description,
      journey: r.permissions.slice(0, 5),
    })),
    features: plan.features.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      priority: f.priority,
    })),
    trustCompliance: plan.trustCompliance,
    assumptions: plan.assumptions.map((a) => a.text),
    outOfScope: plan.outOfScope,
    researchedAt: plan.researchedAt,
    researchSource: plan.researchSource,
  };
}
