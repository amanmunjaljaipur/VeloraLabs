export interface ChatLink {
  label: string;
  href: string;
}

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  alternateQuestions?: string[];
  links?: ChatLink[];
  bullets?: string[];
}

export interface ScoredEntry extends KnowledgeEntry {
  score: number;
}

export interface ChatbotIndex {
  version: number;
  model: string;
  builtAt: string;
  entries: Array<KnowledgeEntry & { embedding?: number[] }>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  links?: ChatLink[];
  suggestions?: string[];
}

export interface ChatResponse {
  answer: string;
  links?: ChatLink[];
  suggestions?: string[];
  confidence: number;
}