/**
 * Product plan shown to the user AFTER research and BEFORE generation.
 * Encodes business model, IA, modules, personas — not hollow marketing pages.
 */

import type { AppExtensionId } from "@/lib/app-builder/types";

export type PlanPageSpec = {
  path: string;
  title: string;
  purpose: string;
  /** Sections the page must include */
  sections: string[];
  /** Public marketing vs authenticated mock dashboard */
  zone: "public" | "authenticated";
};

export type PlanModuleSpec = {
  id: string;
  title: string;
  purpose: string;
  /** Empty / loading / error / success etc. */
  states: string[];
  behaviors: string[];
  zone: "public" | "authenticated";
};

export type PlanPersona = {
  name: string;
  goal: string;
  journey: string[];
};

export type PlanFeature = {
  id: string;
  title: string;
  description: string;
  priority: "must" | "should" | "could";
};

/** Full plan the user reviews before we spend tokens on generation */
export type ProductPlan = {
  version: 1;
  brandName: string;
  tagline: string;
  businessModel: string;
  businessModelDetail: string;
  region: string;
  audience: string[];
  valueProp: string;
  extensionId: AppExtensionId | string;
  appKind: string;
  /** Short plain-language summary for the plan screen */
  summary: string;
  publicPages: PlanPageSpec[];
  modules: PlanModuleSpec[];
  personas: PlanPersona[];
  features: PlanFeature[];
  trustCompliance: string[];
  assumptions: string[];
  /** What we will NOT build in v1 (honest scope) */
  outOfScope: string[];
  researchedAt: string;
  researchSource: string;
};
