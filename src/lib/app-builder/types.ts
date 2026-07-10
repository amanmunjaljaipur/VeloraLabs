/** Prompt can map to any of these; unknown ideas use generic-app */
export type AppExtensionId =
  | "ecom-local-shop"
  | "generic-app"
  | "booking-local"
  | "digital-banking"
  | "insurance"
  | "resume-career"
  | "portfolio"
  | "tuition-centre";

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
  /** Main CTA / active colour */
  primaryColor: string;
  /** Depth / secondary brand colour (gradients, headers) */
  secondaryColor: string;
  /** Highlight colour for prices, badges, chips (multi-colour theme) */
  accentColor?: string;
  /** Soft surface wash behind sections */
  surfaceColor?: string;
  /** Full multi-colour palette (3–8) applied across the shop UI */
  themePalette?: string[];
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
  /** SEO title for share / Google (~50–60 chars) */
  seoTitle?: string;
  /** SEO meta description (~140–160 chars) */
  seoDescription?: string;
}

/** Non-ecom apps: banking, insurance, resume, booking, portfolio, custom… */
export interface GenericAppPage {
  id: string;
  /** Route segment: home | about | pricing | features | contact | faq | apply | … */
  path: string;
  title: string;
  headline?: string;
  bodyHtml: string;
  ctaLabel?: string;
}

export interface GenericAppFeature {
  id: string;
  title: string;
  body: string;
  icon?: string;
}

export interface GenericAppContent {
  extensionId: Exclude<AppExtensionId, "ecom-local-shop"> | "generic-app";
  /** Machine kind from prompt detection */
  appKind: string;
  brandName: string;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  surfaceColor?: string;
  themePalette?: string[];
  city?: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber?: string;
  address?: string;
  heroHeadline: string;
  heroSubheadline: string;
  ctaLabel: string;
  /** Secondary CTA (e.g. "Apply", "Book demo") */
  secondaryCtaLabel?: string;
  aboutHtml: string;
  logo: ShopLogo;
  heroImageUrl?: string;
  nav: Array<{ path: string; label: string }>;
  pages: GenericAppPage[];
  features: GenericAppFeature[];
  faqs: Array<{ question: string; answer: string }>;
  trustBadges: string[];
  footerNote: string;
  seoTitle?: string;
  seoDescription?: string;
  /** Free-form blocks for vertical specifics (plans, form fields labels, etc.) */
  customBlocks?: Array<{ title: string; body: string }>;
  languageNote?: string;
}

export type AppExtensionContent = EcomLocalShopContent | GenericAppContent;

export function isEcomContent(
  content: AppExtensionContent | null | undefined
): content is EcomLocalShopContent {
  return Boolean(content && content.extensionId === "ecom-local-shop");
}

export function isGenericContent(
  content: AppExtensionContent | null | undefined
): content is GenericAppContent {
  return Boolean(content && content.extensionId !== "ecom-local-shop");
}

/** Minimal, structurally-compatible mirror of Forge's ForgeDataField/ForgeDataModel
 *  (kept here, not imported from @/lib/forge/types, to avoid a circular dependency —
 *  app-builder is the lower-level module Forge builds on top of). */
export interface AppDataFieldSpec {
  name: string;
  type: string;
  required?: boolean;
  /** Relation target entity name/id when type is "relation" */
  ref?: string;
  description?: string;
}

export interface AppDataModelSpec {
  id: string;
  name: string;
  description?: string;
  fields: AppDataFieldSpec[];
  relationships?: string[];
}

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
  /** Forge build-plan data models — drives the generic CRUD admin for non-ecommerce apps */
  dataModels?: AppDataModelSpec[];
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
  /** Show "add your own" input (default true) */
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
