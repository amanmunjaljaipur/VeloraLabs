export type AppExtensionId = "ecom-local-shop";

export type AppProjectStatus = "draft" | "live" | "archived";

export type LlmProviderKind = "xai" | "groq" | "custom";

export interface AppInterviewAnswer {
  id: string;
  question: string;
  answer: string;
}

export interface AppLlmConfigPublic {
  provider: LlmProviderKind;
  model: string;
  /** Custom base URL only (never store secrets in public payload) */
  baseUrl?: string;
}

export interface EcomProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image?: string;
  featured?: boolean;
}

export interface EcomLocalShopContent {
  extensionId: "ecom-local-shop";
  brandName: string;
  tagline: string;
  description: string;
  primaryColor: string;
  city: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutHtml: string;
  products: EcomProduct[];
  categories: string[];
  faqs: Array<{ question: string; answer: string }>;
  ctaLabel: string;
  footerNote: string;
}

export type AppExtensionContent = EcomLocalShopContent;

export interface AppProject {
  id: string;
  slug: string;
  name: string;
  prompt: string;
  extensionId: AppExtensionId;
  status: AppProjectStatus;
  answers: AppInterviewAnswer[];
  llm: AppLlmConfigPublic;
  content: AppExtensionContent | null;
  publicPath: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  generatedBy?: string;
}

export interface AppBuilderStore {
  version: number;
  updatedAt: string;
  projects: AppProject[];
}

export interface InterviewQuestion {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  /** Hint for LLM generation */
  hint?: string;
}

/** Request-only secrets — never persisted */
export interface AppLlmSecrets {
  provider: LlmProviderKind;
  apiKey: string;
  model: string;
  baseUrl?: string;
}
