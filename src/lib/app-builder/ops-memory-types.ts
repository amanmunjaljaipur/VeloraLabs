/**
 * Deploy-safe App Builder operational memory.
 * Lives in Blob runtime data - NOT product git content.
 * Survives Vercel deploys; never wiped by code pushes.
 */

export type AppBuilderAgentId =
  | "orchestrator"
  | "vertical-research"
  | "interview"
  | "content"
  | "theme-visuals"
  | "extension-design"
  | "admin-ux"
  | "auth-tenancy"
  | "tour-onboarding"
  | "experience-learner"
  | "packaging-hosting";

export type ExperienceKind =
  | "bugfix"
  | "feature"
  | "owner_feedback"
  | "research"
  | "deploy_note"
  | "process"
  | "seo"
  | "theme"
  | "other";

/** Knowledge pack for one application vertical (ecom, booking, tuition, …) */
export type VerticalResearchPack = {
  id: string;
  label: string;
  /** Plain one-liner for non-tech owners */
  plainLabel: string;
  researchedAt: string;
  updatedAt: string;
  sources: string[];
  /** Industry leaders / reference products */
  leaders: Array<{ name: string; why: string; lesson: string }>;
  visitorJobs: string[];
  ownerJobs: string[];
  publicPages: string[];
  adminMenus: string[];
  interviewThemes: string[];
  channels: string[];
  paymentNorms: string[];
  roles: Array<{ id: string; label: string; default?: boolean }>;
  seoNotes: string[];
  premiumization: string[];
  visualNotes: string[];
  multiColourNotes: string[];
  risks: string[];
  launchChecklist: string[];
  rawNotes: string;
  /** How many times this pack was used by agents */
  useCount: number;
};

export type ExperienceEntry = {
  id: string;
  at: string;
  agent: AppBuilderAgentId | string;
  kind: ExperienceKind;
  /** Optional link to vertical research */
  verticalId?: string;
  summary: string;
  detail: string;
  tags: string[];
  /** If true, treat as production operational fact (do not drop on product moves) */
  productionSafe: boolean;
};

/** Production operational notes that must outlive deploys and product refactors */
export type ProductionOpsMemory = {
  /** Standing facts about live production (env, known gaps, owner preferences) */
  standingNotes: Array<{
    id: string;
    at: string;
    note: string;
    tags: string[];
  }>;
  knownGaps: Array<{
    id: string;
    at: string;
    gap: string;
    severity: "low" | "medium" | "high";
    status: "open" | "mitigated" | "wontfix";
  }>;
  /** Preferences that agents must not "forget" after deploy */
  agentPreferences: Array<{
    id: string;
    key: string;
    value: string;
    at: string;
  }>;
};

export type AppBuilderOpsMemory = {
  version: number;
  updatedAt: string;
  /**
   * Explicit: this file is operational memory.
   * Product deploys MUST NOT reset it. Never seed from git on Vercel.
   */
  memoryClass: "operational";
  verticals: Record<string, VerticalResearchPack>;
  experiences: ExperienceEntry[];
  production: ProductionOpsMemory;
  /** Registry of agent roles for orchestrator */
  agents: Array<{
    id: AppBuilderAgentId;
    label: string;
    skill: string;
    owns: string[];
  }>;
};

export const OPS_MEMORY_FILE = "app-builder-ops-memory.json";

export const DEFAULT_AGENT_REGISTRY: AppBuilderOpsMemory["agents"] = [
  {
    id: "orchestrator",
    label: "App Builder Orchestrator",
    skill: "app-builder-orchestrator",
    owns: ["route tasks", "load ops memory", "ensure research before build"],
  },
  {
    id: "vertical-research",
    label: "Vertical Research Agent",
    skill: "app-vertical-research",
    owns: ["research app type", "update vertical DB", "leaders & channels"],
  },
  {
    id: "interview",
    label: "Interview / PM Agent",
    skill: "app-interview-agent",
    owns: ["dynamic questions", "chips", "workflow discovery"],
  },
  {
    id: "content",
    label: "Content Agent",
    skill: "app-content-agent",
    owns: ["copy", "SEO", "premiumization", "FAQ"],
  },
  {
    id: "theme-visuals",
    label: "Theme & Visuals Agent",
    skill: "app-theme-agent",
    owns: ["multi-colour theme", "logo", "product photos"],
  },
  {
    id: "extension-design",
    label: "Extension Design Agent",
    skill: "verlin-product-builder",
    owns: ["new extension brief", "menus", "roles", "content model"],
  },
  {
    id: "admin-ux",
    label: "Admin UX Agent",
    skill: "app-admin-agent",
    owns: ["admin nav", "CMS", "CRM", "products UI"],
  },
  {
    id: "auth-tenancy",
    label: "Auth & Tenancy Agent",
    skill: "app-auth-agent",
    owns: ["per-app login", "roles", "cookies", "owner bridge"],
  },
  {
    id: "tour-onboarding",
    label: "Tour & Onboarding Agent",
    skill: "app-tour-agent",
    owns: ["guided tour", "checklist", "data-tour"],
  },
  {
    id: "experience-learner",
    label: "Experience Learner",
    skill: "app-experience-agent",
    owns: ["log learnings", "owner feedback", "production-safe notes"],
  },
  {
    id: "packaging-hosting",
    label: "Packaging & Hosting Agent",
    skill: "app-hosting-agent",
    owns: ["Blob persist", "static export", "deploy safety"],
  },
];
