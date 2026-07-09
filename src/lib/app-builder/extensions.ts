import type { AppExtensionId, InterviewQuestion } from "@/lib/app-builder/types";

export interface AppExtensionMeta {
  id: AppExtensionId;
  label: string;
  description: string;
  /** Deployed app path prefix */
  pathPrefix: string;
  questions: InterviewQuestion[];
}

export const APP_EXTENSIONS: AppExtensionMeta[] = [
  {
    id: "ecom-local-shop",
    label: "Local shop (e‑commerce)",
    description:
      "Full local retail site: home, shop, product cards, about, contact, FAQ — ready to publish under /apps/your-slug",
    pathPrefix: "/apps",
    questions: [
      {
        id: "brandName",
        label: "What is the shop / brand name?",
        placeholder: "Jaipur Craft Basket",
        required: true,
      },
      {
        id: "city",
        label: "Which city or area does this shop serve?",
        placeholder: "Jaipur, Rajasthan",
        required: true,
      },
      {
        id: "whatYouSell",
        label: "What do you sell? (categories + 3–6 example products)",
        placeholder: "Handmade pottery, block-print textiles, diyas…",
        required: true,
        multiline: true,
        hint: "List product types and a few concrete product names with rough prices in INR",
      },
      {
        id: "audience",
        label: "Who is the primary customer?",
        placeholder: "Local families and tourists looking for gifts",
        required: true,
      },
      {
        id: "tone",
        label: "Brand tone / style",
        placeholder: "Warm, craft-forward, trustworthy, simple Hindi-English mix ok",
        required: true,
      },
      {
        id: "contact",
        label: "Contact details (email, phone, address if any)",
        placeholder: "shop@example.com · +91 … · Street, City",
        required: true,
        multiline: true,
      },
      {
        id: "currency",
        label: "Currency / price format",
        placeholder: "INR (₹)",
        required: false,
      },
      {
        id: "extra",
        label: "Anything else the shop must include?",
        placeholder: "WhatsApp orders, pickup only, festival specials…",
        required: false,
        multiline: true,
      },
    ],
  },
];

export function getExtension(id: string): AppExtensionMeta | undefined {
  return APP_EXTENSIONS.find((e) => e.id === id);
}

export function slugifyAppName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
