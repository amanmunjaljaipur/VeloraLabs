/**
 * App Studio - interactive multi-role product apps (not marketing shells).
 */

export type StudioFileMap = Record<string, string>;

export type StudioMessageRole = "user" | "assistant" | "system";

export type StudioChatMessage = {
  id: string;
  role: StudioMessageRole;
  content: string;
  imageDataUrl?: string;
  createdAt: string;
};

export type StudioVersion = {
  id: string;
  label: string;
  prompt: string;
  files: StudioFileMap;
  createdAt: string;
  appSpec?: StudioAppSpec;
};

export type StudioResearchPack = {
  summary: string;
  targetUsers: string[];
  coreWorkflows: Array<{ name: string; steps: string[] }>;
  screens: string[];
  dataEntities: string[];
  techNotes: string[];
  competitors: Array<{ name: string; takeaway: string }>;
  /** Expanded product brief after prompt rewrite */
  rewrittenPrompt?: string;
};

export type StudioFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "status"
  | "email"
  | "phone";

export type StudioEntityField = {
  key: string;
  label: string;
  type: StudioFieldType;
  options?: string[];
  required?: boolean;
};

export type StudioEntity = {
  id: string;
  name: string;
  namePlural: string;
  fields: StudioEntityField[];
  /** Default status values for boards/workflows */
  statuses?: string[];
  seed: Array<Record<string, unknown>>;
};

export type StudioRole = {
  id: string;
  label: string;
  description: string;
  /** Can create records on primary entity */
  canCreate?: boolean;
  /** Can change status / approve */
  canManage?: boolean;
  isDefault?: boolean;
};

export type StudioScreenType =
  | "dashboard"
  | "list"
  | "form"
  | "board"
  | "schedule"
  | "detail"
  | "settings"
  /** Split editor + live document preview (resume, proposals…) */
  | "workspace"
  /** Multi-step money / payment flow */
  | "transfer";

/** Drives specialized product UI (not generic CRUD only). */
export type StudioProductKind =
  | "resume"
  | "banking"
  | "ecommerce"
  | "booking"
  | "expense"
  | "crm"
  | "tasks"
  | "generic";

export type StudioScreen = {
  id: string;
  title: string;
  type: StudioScreenType;
  /** Empty = all roles */
  roleIds: string[];
  entityId?: string;
  description?: string;
  imageUrl?: string;
};

export type StudioWorkflow = {
  id: string;
  name: string;
  description: string;
  roleId: string;
  steps: string[];
  screenId: string;
  entityId?: string;
};

/** Educational content pack (Verlin Labs voice) for product homes & demos */
export type StudioLearningContent = {
  heroHeadline: string;
  heroSub: string;
  whoItsFor: string;
  outcomes: string[];
  howItWorks: Array<{ step: string; detail: string }>;
  trustLines: string[];
  faqs: Array<{ question: string; answer: string }>;
};

/**
 * Industry-standard product chrome (IA researched from market leaders).
 * Drives primary nav, mobile bottom tabs, utility menu, and production footer.
 */
export type StudioNavItem = {
  id: string;
  label: string;
  /** Maps to a screen id when possible */
  screenId?: string;
  /** lucide icon key */
  icon?: string;
  /** Role filter; empty = all */
  roleIds?: string[];
  /** Section header in sidebar */
  section?: string;
  /** Opens footer/legal/help panel instead of a screen */
  panel?: "help" | "legal" | "privacy" | "terms" | "security" | "about" | "support";
};

export type StudioFooterColumn = {
  title: string;
  links: Array<{
    label: string;
    screenId?: string;
    panel?: StudioNavItem["panel"];
    /** Display-only external-style link */
    hrefLabel?: string;
  }>;
};

export type StudioProductShell = {
  /** Market-standard layout pattern for this vertical */
  navPattern: "bottom-tabs" | "sidebar" | "top-tabs" | "hybrid";
  /** Benchmark products this IA is modeled on */
  marketBenchmarks: string[];
  /** IA research notes (short) */
  iaRationale: string;
  /** Primary destinations (≤5 for bottom tabs; more OK for sidebar) */
  primaryNav: StudioNavItem[];
  /** Overflow / “More” destinations */
  moreNav: StudioNavItem[];
  /** Desktop utility links (header right / sidebar bottom) */
  utilityNav: StudioNavItem[];
  footer: {
    columns: StudioFooterColumn[];
    copyright: string;
    /** Regulatory / industry disclaimers */
    disclaimers: string[];
    /** Trust badges e.g. “Bank-grade encryption (demo)” */
    trustBadges: string[];
    supportLine: string;
  };
  /** Empty-state copy keyed by screen type or id */
  emptyStates?: Record<string, string>;
  /** Primary CTA labels */
  ctaLabels?: Record<string, string>;
};

/** Full interactive app definition - drives the working runtime */
export type StudioAppSpec = {
  version: 1;
  brandName: string;
  tagline: string;
  description: string;
  rewrittenPrompt: string;
  primaryColor: string;
  accentColor: string;
  /** Specialized product experience in the runtime */
  productKind?: StudioProductKind;
  roles: StudioRole[];
  entities: StudioEntity[];
  screens: StudioScreen[];
  workflows: StudioWorkflow[];
  research?: StudioResearchPack;
  /** Verlin-style educational content for dashboards & settings */
  learning?: StudioLearningContent;
  /** Production-grade nav + footer chrome */
  shell?: StudioProductShell;
};

export type StudioGenerateResult = {
  files: StudioFileMap;
  summary: string;
  research?: StudioResearchPack | null;
  appSpec?: StudioAppSpec | null;
  designedBy: string;
};
