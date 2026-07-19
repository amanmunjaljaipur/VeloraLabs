/**
 * App Content Agent - generates SEO-ready, premium local shop copy
 * from existing content + interview answers (platform LLM).
 */

import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";
import { sanitizeShopHtml } from "@/lib/app-builder/security";
import { resolveShopTheme } from "@/lib/app-builder/shop-theme";
import type {
  AppInterviewAnswer,
  EcomLocalShopContent,
  EcomProduct,
} from "@/lib/app-builder/types";

export type ContentAgentScope =
  | "all"
  | "home"
  | "about"
  | "faq"
  | "seo"
  | "products";

export type ContentAgentPack = {
  seoTitle?: string;
  seoDescription?: string;
  tagline?: string;
  description?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  ctaLabel?: string;
  aboutHtml?: string;
  faqs?: Array<{ question: string; answer: string }>;
  trustBadges?: string[];
  footerNote?: string;
  languageNote?: string;
  productTweaks?: Array<{ id: string; description?: string }>;
};

const SYSTEM = `You are the Verlin Labs App Content Agent for local Indian shops.
Write Class-8 English: clear, warm, specific, premium but not corporate.
Never invent phone numbers, emails, street addresses, or products not listed.
Never mention "AI", "LLM", or "generated".
Return ONLY valid JSON matching the schema keys you are asked for.
SEO: seoTitle ~50-60 chars (Brand · City | offer); seoDescription ~140-160 chars.
Premiumization: concrete benefits, city, real order methods (WhatsApp, UPI, pickup).
FAQs: natural customer questions about order, pay, deliver, hours.
aboutHtml: 2-3 short <p> paragraphs only, no scripts.`;

function answersToMap(answers: AppInterviewAnswer[]): Record<string, string> {
  return Object.fromEntries(answers.map((a) => [a.id, a.answer.trim()]));
}

function productSummary(products: EcomProduct[]) {
  return products.slice(0, 12).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    description: p.description?.slice(0, 120),
  }));
}

function scopeKeys(scope: ContentAgentScope): string[] {
  switch (scope) {
    case "home":
      return ["tagline", "heroHeadline", "heroSubheadline", "ctaLabel", "trustBadges", "description"];
    case "about":
      return ["aboutHtml", "description"];
    case "faq":
      return ["faqs"];
    case "seo":
      return ["seoTitle", "seoDescription", "description", "tagline"];
    case "products":
      return ["productTweaks"];
    case "all":
    default:
      return [
        "seoTitle",
        "seoDescription",
        "tagline",
        "description",
        "heroHeadline",
        "heroSubheadline",
        "ctaLabel",
        "aboutHtml",
        "faqs",
        "trustBadges",
        "footerNote",
        "productTweaks",
      ];
  }
}

/** Deterministic fallback when no LLM key */
export function buildContentFallback(
  content: EcomLocalShopContent,
  answers: AppInterviewAnswer[] = []
): ContentAgentPack {
  const a = answersToMap(answers);
  const brand = content.brandName;
  const city = content.city;
  const offer =
    a.whatYouSell?.slice(0, 60) ||
    content.products
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ") ||
    "local products";
  const methods = (content.orderMethods || []).join(", ") || "WhatsApp or call";
  const pay = (content.paymentMethods || []).join(", ") || "UPI or cash";

  return {
    seoTitle: `${brand} · ${city} | ${offer.slice(0, 28)}`.slice(0, 60),
    seoDescription: `${brand} in ${city} - ${offer}. Order via ${methods}.`.slice(0, 160),
    tagline: content.tagline || `Local favourites from ${city}`,
    description:
      content.description ||
      `${brand} serves ${city} with ${offer}. Order easily via ${methods}.`,
    heroHeadline: content.heroHeadline || `Welcome to ${brand}`,
    heroSubheadline:
      content.heroSubheadline ||
      `Quality from ${city}. Order via ${methods} - we reply personally.`,
    ctaLabel: content.ctaLabel || "See products",
    aboutHtml:
      content.aboutHtml ||
      `<p>${brand} is a local shop in ${city}.</p><p>We offer ${offer}. Customers order via ${methods}.</p>`,
    faqs:
      content.faqs?.length >= 3
        ? content.faqs
        : [
            {
              question: "How do I place an order?",
              answer: `You can order via ${methods}. We confirm everything with you personally.`,
            },
            {
              question: "How do I pay?",
              answer: `Payment options include ${pay}. We will confirm when you order.`,
            },
            {
              question: "Do you deliver?",
              answer:
                content.deliveryNote ||
                "Ask us about delivery nearby - pickup is always available when listed.",
            },
          ],
    trustBadges:
      content.trustBadges?.length > 0
        ? content.trustBadges
        : [city, methods.split(",")[0]?.trim() || "Easy order", pay.split(",")[0]?.trim() || "Fair prices"].filter(
            Boolean
          ),
    footerNote: content.footerNote || `© ${new Date().getFullYear()} ${brand} · ${city}`,
  };
}

export async function runContentAgent(input: {
  content: EcomLocalShopContent;
  answers?: AppInterviewAnswer[];
  scope?: ContentAgentScope;
  customInstruction?: string;
}): Promise<{ pack: ContentAgentPack; source: "llm" | "fallback" }> {
  const scope = input.scope || "all";
  const fallback = buildContentFallback(input.content, input.answers);
  const secrets = resolveAppBuilderSecrets();
  if (!secrets) {
    return { pack: pickScope(fallback, scope), source: "fallback" };
  }

  const theme = resolveShopTheme(input.content);
  const keys = scopeKeys(scope);

  try {
    const raw = await callUserLlm({
      secrets,
      temperature: 0.4,
      maxTokens: 3500,
      timeoutMs: 60_000,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            task: "Generate storefront content pack",
            returnOnlyKeys: keys,
            brand: {
              brandName: input.content.brandName,
              city: input.content.city,
              contactPhone: input.content.contactPhone,
              contactEmail: input.content.contactEmail,
              address: input.content.address,
              openingHours: input.content.openingHours,
            },
            existing: {
              tagline: input.content.tagline,
              description: input.content.description,
              heroHeadline: input.content.heroHeadline,
              heroSubheadline: input.content.heroSubheadline,
              aboutHtml: input.content.aboutHtml?.slice(0, 800),
              faqs: input.content.faqs,
              trustBadges: input.content.trustBadges,
              orderMethods: input.content.orderMethods,
              paymentMethods: input.content.paymentMethods,
              deliveryNote: input.content.deliveryNote,
              ownerHighlights: input.content.ownerHighlights,
            },
            products: productSummary(input.content.products || []),
            interviewAnswers: answersToMap(input.answers || []),
            multiColourTheme: {
              primary: theme.primary,
              secondary: theme.secondary,
              accent: theme.accent,
              palette: theme.palette,
            },
            ownerNote: input.customInstruction || "",
            rules: [
              "Keep contact facts unchanged",
              "Improve clarity and premium local tone",
              "SEO ready title and description",
              "At least 3 FAQs when faqs key requested",
              "productTweaks only for listed product ids; optional description polish only",
            ],
          }),
        },
      ],
    });

    const parsed = parseJsonObject<ContentAgentPack>(raw);
    const merged = mergePack(fallback, parsed, keys);
    return { pack: sanitizePack(merged, input.content), source: "llm" };
  } catch {
    return { pack: pickScope(fallback, scope), source: "fallback" };
  }
}

function pickScope(pack: ContentAgentPack, scope: ContentAgentScope): ContentAgentPack {
  const keys = scopeKeys(scope);
  const out: ContentAgentPack = {};
  for (const k of keys) {
    const v = pack[k as keyof ContentAgentPack];
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

function mergePack(
  base: ContentAgentPack,
  parsed: ContentAgentPack,
  keys: string[]
): ContentAgentPack {
  const out: ContentAgentPack = {};
  for (const k of keys) {
    const p = parsed[k as keyof ContentAgentPack];
    const b = base[k as keyof ContentAgentPack];
    (out as Record<string, unknown>)[k] = p !== undefined && p !== null && p !== "" ? p : b;
  }
  return out;
}

function sanitizePack(pack: ContentAgentPack, content: EcomLocalShopContent): ContentAgentPack {
  const out = { ...pack };
  if (out.seoTitle) out.seoTitle = String(out.seoTitle).slice(0, 70);
  if (out.seoDescription) out.seoDescription = String(out.seoDescription).slice(0, 180);
  if (out.tagline) out.tagline = String(out.tagline).slice(0, 120);
  if (out.heroHeadline) out.heroHeadline = String(out.heroHeadline).slice(0, 100);
  if (out.heroSubheadline) out.heroSubheadline = String(out.heroSubheadline).slice(0, 220);
  if (out.ctaLabel) out.ctaLabel = String(out.ctaLabel).slice(0, 40);
  if (out.aboutHtml) {
    // Defer full sanitize to apply path; still strip scripts early
    out.aboutHtml = String(out.aboutHtml)
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+\s*=/gi, " data-removed=")
      .slice(0, 4000);
  }
  if (out.faqs) {
    out.faqs = out.faqs
      .filter((f) => f?.question && f?.answer)
      .slice(0, 8)
      .map((f) => ({
        question: String(f.question).slice(0, 120),
        answer: String(f.answer).slice(0, 400),
      }));
  }
  if (out.trustBadges) {
    out.trustBadges = out.trustBadges.map((t) => String(t).slice(0, 40)).slice(0, 6);
  }
  if (out.productTweaks) {
    const ids = new Set(content.products.map((p) => p.id));
    out.productTweaks = out.productTweaks
      .filter((t) => t?.id && ids.has(t.id))
      .map((t) => ({
        id: t.id,
        description: t.description ? String(t.description).slice(0, 280) : undefined,
      }));
  }
  return out;
}

/** Apply pack onto content (immutable) */
export function applyContentPack(
  content: EcomLocalShopContent,
  pack: ContentAgentPack
): EcomLocalShopContent {
  const next: EcomLocalShopContent = { ...content };
  if (pack.seoTitle !== undefined) next.seoTitle = pack.seoTitle;
  if (pack.seoDescription !== undefined) next.seoDescription = pack.seoDescription;
  if (pack.tagline !== undefined) next.tagline = pack.tagline;
  if (pack.description !== undefined) next.description = pack.description;
  if (pack.heroHeadline !== undefined) next.heroHeadline = pack.heroHeadline;
  if (pack.heroSubheadline !== undefined) next.heroSubheadline = pack.heroSubheadline;
  if (pack.ctaLabel !== undefined) next.ctaLabel = pack.ctaLabel;
  if (pack.aboutHtml !== undefined) next.aboutHtml = sanitizeShopHtml(pack.aboutHtml);
  if (pack.faqs !== undefined) next.faqs = pack.faqs;
  if (pack.trustBadges !== undefined) next.trustBadges = pack.trustBadges;
  if (pack.footerNote !== undefined) next.footerNote = pack.footerNote;
  if (pack.languageNote !== undefined) next.languageNote = pack.languageNote;
  if (pack.productTweaks?.length) {
    const map = new Map(pack.productTweaks.map((t) => [t.id, t]));
    next.products = content.products.map((p) => {
      const t = map.get(p.id);
      if (!t?.description) return p;
      return { ...p, description: t.description };
    });
  }
  return next;
}
