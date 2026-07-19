/**
 * Published demo stores - tenant super-admin rights scoped to THIS module only.
 * Not platform super_admin (no newsletter, role-assignment, site-wide legal, etc.).
 */

export type StoreCategoryId =
  | "mass-marketplace"
  | "food-delivery"
  | "grocery-qcommerce"
  | "brand-shopping"
  | "secondhand-marketplace"
  | "loyalty-cashback"
  | "digital-banking"
  | "generic";

/** Rights a store owner gets - relevant product-admin only */
export const STORE_OWNER_RIGHTS = [
  "store.brand", // name, logo, theme
  "store.category", // pick vertical
  "store.publish", // permanent /s/{id} path
  "store.cms", // home/about/contact/faq copy
  "store.crm", // leads/contacts for this store
  "store.chatbot", // train bot on store content only
  "store.products", // catalog for ecom stores
  "store.team", // invite note (local)
  "store.analytics", // simple counters
] as const;

export type StoreOwnerRight = (typeof STORE_OWNER_RIGHTS)[number];

/** Explicitly NOT granted (platform super_admin only) */
export const STORE_OWNER_EXCLUDED = [
  "platform.role_assignment",
  "platform.newsletter",
  "platform.site_cms_global",
  "platform.legal",
  "platform.agents",
  "platform.module_access",
  "platform.sessions_admin",
] as const;

export type StoreTheme = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
};

export type StoreCmsPage = {
  id: "home" | "about" | "contact" | "faq" | "privacy";
  title: string;
  body: string;
  published: boolean;
};

export type StoreCrmLead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  note?: string;
  stage: "new" | "contacted" | "won" | "lost";
  createdAt: string;
};

export type StoreChatbotConfig = {
  enabled: boolean;
  /** System personality for this store only */
  persona: string;
  /** Owner-trained Q&A */
  faqs: Array<{ id: string; question: string; answer: string }>;
  welcomeMessage: string;
};

export type StoreProduct = {
  id: string;
  title: string;
  price: number;
  description: string;
  status: "Active" | "Hidden";
};

export type DemoStore = {
  /** Permanent public id → /s/{id} e.g. ecom-food_1 */
  id: string;
  /** Human extension label */
  extension: string;
  categoryId: StoreCategoryId;
  brandName: string;
  tagline: string;
  logoDataUrl?: string;
  theme: StoreTheme;
  ownerEmail: string;
  ownerName: string;
  /** Source demo app slug if spun from a demo */
  sourceDemoSlug?: string;
  published: boolean;
  cms: StoreCmsPage[];
  crm: StoreCrmLead[];
  chatbot: StoreChatbotConfig;
  products: StoreProduct[];
  /** Simple analytics */
  visits: number;
  createdAt: string;
  updatedAt: string;
};

export type DemoStoreRegistry = {
  version: 1;
  updatedAt: string;
  stores: DemoStore[];
};

export const DEFAULT_THEME: StoreTheme = {
  primary: "#0f2744",
  secondary: "#1e293b",
  accent: "#0d9488",
  surface: "#f8fafc",
};

export function defaultCms(brand: string): StoreCmsPage[] {
  return [
    {
      id: "home",
      title: `Welcome to ${brand}`,
      body: `${brand} helps you shop with clarity. Fair prices, honest delivery notes, and easy returns.`,
      published: true,
    },
    {
      id: "about",
      title: "About us",
      body: `We built ${brand} for customers who want a simple, trustworthy experience.`,
      published: true,
    },
    {
      id: "contact",
      title: "Contact",
      body: "Email support@example.com or use the in-app help chat. Response times are demo-only.",
      published: true,
    },
    {
      id: "faq",
      title: "FAQ",
      body: "Q: How do returns work?\nA: Start a return from Orders within the demo return window.\n\nQ: Is payment real?\nA: No - all payments are simulated.",
      published: true,
    },
    {
      id: "privacy",
      title: "Privacy",
      body: `${brand} demo store. Do not enter real secrets. Data may be stored in browser and platform demo storage.`,
      published: true,
    },
  ];
}

export function defaultChatbot(brand: string): StoreChatbotConfig {
  return {
    enabled: true,
    persona: `You are the helpful assistant for ${brand}. Answer only about this store's products, orders, and policies. Be clear and short.`,
    welcomeMessage: `Hi - I'm the ${brand} assistant. Ask about products, delivery, or returns.`,
    faqs: [
      {
        id: "f1",
        question: "What are your delivery times?",
        answer: "Express items typically next day; standard 2–4 days (demo estimates).",
      },
      {
        id: "f2",
        question: "How do I return an item?",
        answer: "Open Orders, choose the order, and start a return if eligible.",
      },
    ],
  };
}

export function slugifyStoreId(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-")
      .slice(0, 48) || "store"
  );
}

/** Build permanent path: /s/ecom-food_1 */
export function storePublicPath(id: string): string {
  return `/s/${id}`;
}

export const CATEGORY_OPTIONS: Array<{
  id: StoreCategoryId;
  label: string;
  prefix: string;
}> = [
  { id: "mass-marketplace", label: "Mass marketplace (ecom)", prefix: "ecom" },
  { id: "food-delivery", label: "Food delivery", prefix: "ecom-food" },
  { id: "grocery-qcommerce", label: "Grocery / quick commerce", prefix: "ecom-grocery" },
  { id: "brand-shopping", label: "Brand / D2C shop", prefix: "ecom-brand" },
  { id: "secondhand-marketplace", label: "Secondhand marketplace", prefix: "ecom-used" },
  { id: "loyalty-cashback", label: "Loyalty / cashback", prefix: "ecom-loyalty" },
  { id: "digital-banking", label: "Digital banking", prefix: "fin-bank" },
  { id: "generic", label: "Custom / other", prefix: "app" },
];
