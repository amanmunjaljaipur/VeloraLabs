import type { ChatLink } from "./types";

export type TrainingSource = "manual" | "import" | "seed";

export interface TrainingEntry {
  id: string;
  category: string;
  question: string;
  alternateQuestions: string[];
  answer: string;
  bullets: string[];
  keywords: string[];
  links: ChatLink[];
  enabled: boolean;
  source: TrainingSource;
  updatedAt: string;
  updatedBy?: string;
}

export interface TrainingDataset {
  version: number;
  updatedAt: string;
  lastTrainedAt: string | null;
  entries: TrainingEntry[];
}

export interface TrainingEntryInput {
  category: string;
  question: string;
  alternateQuestions?: string[];
  answer: string;
  bullets?: string[];
  keywords?: string[];
  links?: ChatLink[];
  enabled?: boolean;
}

export const TRAINING_CATEGORIES = [
  "General",
  "Free Session",
  "Pricing",
  "Courses",
  "Learning",
  "Contact",
  "Resources",
  "Newsletter",
  "Teams",
] as const;

export const EXCEL_COLUMNS = [
  "Category",
  "Question",
  "Answer",
  "Alternate Questions",
  "Keywords",
  "Bullets",
  "Link Label",
  "Link URL",
  "Enabled",
] as const;