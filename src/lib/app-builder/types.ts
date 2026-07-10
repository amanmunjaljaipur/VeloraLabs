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
  /** Full product photo URL (AI-generated or owner-provided) */
  image?: string;
  /** Visual emoji / icon fallback when image fails */
  emoji?: string;
  featured?: boolean;
}

export interface ShopLogo {
  initials: string;
  emoji: string;
  motif: string;
  bgFrom: string;
  bgTo: string;
  /** Short tag under logo, e.g. "Jaipur · Crafts" */
  badge: string;
  /** generate = we designed it; upload = owner shared a link */
  mode?: "generate" | "upload";
  /** Logo image URL (AI mark or owner's file host link) */
  imageUrl?: string;
}

export interface EcomLocalShopContent {
  extensionId: "ecom-local-shop";
  brandName: string;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  city: string;
  region?: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber?: string;
  address: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutHtml: string;
  products: EcomProduct[];
  categories: string[];
  faqs: Array<{ question: string; answer: string }>;
  ctaLabel: string;
  footerNote: string;
  /** Location-aware brand mark (+ optional image) */
  logo: ShopLogo;
  /** Hero visual theme key (desert, metro, coastal, …) */
  heroTheme: string;
  /** Full-bleed hero photograph */
  heroImageUrl?: string;
  /** About-page atmosphere photo */
  aboutImageUrl?: string;
  /** Extra gallery images for home strip */
  galleryImageUrls?: string[];
  openingHours?: string;
  orderMethods: string[];
  paymentMethods: string[];
  deliveryNote?: string;
  trustBadges: string[];
  /** Extra highlights the owner added in their own words */
  ownerHighlights: string[];
  languageNote?: string;
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
  /** Free-form points the user added themselves */
  customPoints?: string[];
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

export type InterviewSelectMode = "single" | "multi" | "free";

export interface InterviewQuestion {
  id: string;
  /** Plain-language question (no tech jargon) */
  label: string;
  /** Friendly coach line under the question */
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  /** Hint for LLM generation */
  hint?: string;
  /** Tappable suggestion chips */
  suggestions?: string[];
  /** single = one chip; multi = many chips; free = type only */
  selectMode?: InterviewSelectMode;
  /** Show “add your own” input (default true) */
  allowCustom?: boolean;
}

/** Example shop ideas for the first step */
export interface AppIdeaExample {
  id: string;
  title: string;
  description: string;
  prompt: string;
  emoji: string;
}

/** Request-only secrets — never persisted */
export interface AppLlmSecrets {
  provider: LlmProviderKind;
  apiKey: string;
  model: string;
  baseUrl?: string;
}
