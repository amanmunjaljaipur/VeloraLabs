/**
 * App Studio — interactive multi-role product apps (not marketing shells).
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

/** Full interactive app definition — drives the working runtime */
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
};

export type StudioGenerateResult = {
  files: StudioFileMap;
  summary: string;
  research?: StudioResearchPack | null;
  appSpec?: StudioAppSpec | null;
  designedBy: string;
};
