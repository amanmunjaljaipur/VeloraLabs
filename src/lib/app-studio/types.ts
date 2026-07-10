/**
 * App Studio — Lovable-style AI web app generator (in-repo).
 */

export type StudioFileMap = Record<string, string>;

export type StudioMessageRole = "user" | "assistant" | "system";

export type StudioChatMessage = {
  id: string;
  role: StudioMessageRole;
  content: string;
  /** Optional image data URL or description for vision-to-code */
  imageDataUrl?: string;
  createdAt: string;
};

export type StudioVersion = {
  id: string;
  label: string;
  prompt: string;
  files: StudioFileMap;
  createdAt: string;
};

export type StudioResearchPack = {
  summary: string;
  targetUsers: string[];
  coreWorkflows: Array<{ name: string; steps: string[] }>;
  screens: string[];
  dataEntities: string[];
  techNotes: string[];
  competitors: Array<{ name: string; takeaway: string }>;
};

export type StudioGenerateResult = {
  files: StudioFileMap;
  summary: string;
  research?: StudioResearchPack | null;
  designedBy: string;
};
