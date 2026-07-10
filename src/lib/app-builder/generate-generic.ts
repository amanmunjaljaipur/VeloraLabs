/**
 * Generate non-ecom apps (banking, insurance, resume, booking, portfolio, custom).
 */

import { buildShopLogo } from "@/lib/app-builder/branding";
import { detectVerticalFromPrompt } from "@/lib/app-builder/detect-vertical";
import { heroImageUrl } from "@/lib/app-builder/images";
import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import { sanitizeShopHtml } from "@/lib/app-builder/security";
import { productPlanToGenericContent } from "@/lib/app-builder/plan-to-content";
import type { ProductPlan } from "@/lib/app-builder/product-plan-types";
import type {
  AppExtensionId,
  AppInterviewAnswer,
  AppLlmSecrets,
  GenericAppContent,
  GenericAppFeature,
  GenericAppPage,
  ShopLogo,
} from "@/lib/app-builder/types";

function answerMap(answers: AppInterviewAnswer[]): Record<string, string> {
  return Object.fromEntries(answers.map((a) => [a.id, a.answer.trim()]));
}

function makeLogo(brandName: string, city: string): ShopLogo {
  const b = buildShopLogo(brandName, city || "India");
  return {
    initials: b.initials,
    emoji: b.emoji,
    motif: b.motif,
    bgFrom: b.bgFrom,
    bgTo: b.bgTo,
    badge: b.badge,
    mode: "generate",
  };
}

function fallbackGeneric(
  prompt: string,
  answers: AppInterviewAnswer[],
  customPoints: string[],
  extensionId: AppExtensionId
): GenericAppContent {
  const a = answerMap(answers);
  const detected = detectVerticalFromPrompt(prompt);
  const brand =
    a.brandName ||
    a.name ||
    prompt
      .split(/[.!?\n]/)
      [0]
      ?.replace(/^(i want|build|create|make)\s+(an?\s+)?/i, "")
      .slice(0, 40)
      .trim() ||
    detected.label;
  const city = a.city || "India";
  const logo = makeLogo(brand, city);
  const who = a.whoFor || "people who need this";
  const job = a.mainJob || a.problemSolved || prompt.slice(0, 120);
  const features: GenericAppFeature[] = (
    a.mustHaveFeatures
      ? a.mustHaveFeatures.split(/[,;\n|]+/).map((s) => s.trim()).filter(Boolean)
      : ["Simple home", "Clear next step", "Trust & FAQ", "Contact"]
  )
    .slice(0, 6)
    .map((title, i) => ({
      id: `f${i + 1}`,
      title,
      body: `Helpful ${title.toLowerCase()} for ${who}.`,
      icon: "✨",
    }));

  const pages: GenericAppPage[] = [
    {
      id: "home",
      path: "home",
      title: "Home",
      headline: job.slice(0, 80) || brand,
      bodyHtml: `<p>${prompt.slice(0, 400)}</p><p>Built for ${who}.</p>`,
      ctaLabel: a.ctaLabel || "Get started",
    },
    {
      id: "about",
      path: "about",
      title: "About",
      headline: `About ${brand}`,
      bodyHtml: `<p>${brand} helps ${who}. ${job}</p>${
        customPoints.length
          ? `<ul>${customPoints.map((p) => `<li>${p}</li>`).join("")}</ul>`
          : ""
      }`,
    },
    {
      id: "features",
      path: "features",
      title: "Features",
      headline: "What you get",
      bodyHtml: features.map((f) => `<p><strong>${f.title}</strong> — ${f.body}</p>`).join(""),
    },
    {
      id: "faq",
      path: "faq",
      title: "FAQ",
      headline: "Questions",
      bodyHtml: "<p>Common questions will grow as you edit the site.</p>",
    },
    {
      id: "contact",
      path: "contact",
      title: "Contact",
      headline: "Talk to us",
      bodyHtml: `<p>${a.contact || "Add your phone or email in admin."}</p>`,
      ctaLabel: "Message us",
    },
  ];

  const extId = (
    extensionId === "ecom-local-shop" ? "generic-app" : extensionId
  ) as GenericAppContent["extensionId"];

  return {
    extensionId: extId,
    appKind: detected.appKind,
    brandName: brand.slice(0, 60),
    tagline: job.slice(0, 100),
    description: prompt.slice(0, 400),
    primaryColor: logo.bgFrom || "#0d9488",
    secondaryColor: logo.bgTo || "#0a1628",
    accentColor: logo.bgFrom,
    themePalette: [logo.bgFrom, logo.bgTo, "#0d9488"],
    city,
    contactEmail: a.contact?.includes("@") ? a.contact : "hello@example.com",
    contactPhone: a.contact?.match(/\+?[\d][\d\s-]{8,}/)?.[0] || "",
    whatsappNumber: a.contact?.match(/\+?[\d][\d\s-]{8,}/)?.[0] || "",
    heroHeadline: job.slice(0, 80) || brand,
    heroSubheadline: `For ${who}. Simple, clear, ready to share.`,
    ctaLabel: a.ctaLabel || "Get started",
    secondaryCtaLabel: "Learn more",
    aboutHtml: sanitizeShopHtml(`<p>${prompt.slice(0, 500)}</p>`),
    logo,
    heroImageUrl: heroImageUrl({
      brandName: brand,
      city,
      whatYouSell: job,
      vibe: a.tone || "modern trustworthy",
    }),
    nav: pages.map((p) => ({ path: p.path, label: p.title })),
    pages,
    features,
    faqs: [
      {
        question: "What is this product?",
        answer: job || prompt.slice(0, 200),
      },
      {
        question: "Who is it for?",
        answer: who,
      },
      {
        question: "How do I start?",
        answer: "Use the main button on the home page or contact us.",
      },
    ],
    trustBadges: ["Clear & simple", "Made for real users", city].filter(Boolean),
    footerNote: `© ${new Date().getFullYear()} ${brand}`,
    seoTitle: `${brand} · ${detected.label}`.slice(0, 60),
    seoDescription: (job || prompt).slice(0, 160),
    customBlocks: customPoints.slice(0, 8).map((p, i) => ({
      title: `Note ${i + 1}`,
      body: p,
    })),
  };
}

export async function generateGenericAppContent(input: {
  extensionId: AppExtensionId;
  prompt: string;
  answers: AppInterviewAnswer[];
  customPoints?: string[];
  secrets: AppLlmSecrets;
  productPlan?: ProductPlan;
  seedContent?: GenericAppContent;
}): Promise<{ content: GenericAppContent; generatedBy: string }> {
  const customPoints = input.customPoints || [];
  const detected = detectVerticalFromPrompt(input.prompt);
  const extensionId =
    input.extensionId === "ecom-local-shop" ? "generic-app" : input.extensionId;

  // Prefer approved plan structure as the source of pages/modules
  const planSeed = input.productPlan
    ? productPlanToGenericContent(input.productPlan)
    : input.seedContent;

  const qa = input.answers
    .filter((a) => a.answer.trim())
    .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");
  const customBlock = customPoints.length
    ? `\n\nOwner notes:\n${customPoints.map((p) => `- ${p}`).join("\n")}`
    : "";

  try {
    const pageList =
      planSeed?.pages.map((p) => `${p.path}: ${p.title}`).join(", ") ||
      "home, features, about, faq, contact, plus all plan pages";
    const raw = await callUserLlm({
      secrets: input.secrets,
      temperature: 0.35,
      maxTokens: 5500,
      timeoutMs: 90_000,
      messages: [
        {
          role: "system",
          content: `You build COMPLETE product website content for Verlin Labs App Builder.
Detected kind: ${detected.label} (${detected.appKind}).
You MUST implement the APPROVED PRODUCT PLAN pages — do not collapse to 3 marketing pages.
For banking: include public product/rates/security/apply AND demo dashboard, transactions, transfer (with review/2FA copy), cards, statements, profile.
For insurance: plans, quote, claims, policy demo.
For resume: workspace, linkedin, export, templates.
Class-8 English. No fake licence numbers. bodyHtml uses only <p>/<ul>/<li>/<strong>/<em>.
Return ONLY JSON with ALL pages from the plan (same paths), filled with real section copy:
brandName, tagline, description, primaryColor, secondaryColor, city, contactEmail, contactPhone,
heroHeadline, heroSubheadline, ctaLabel, secondaryCtaLabel, aboutHtml,
nav, pages[{id,path,title,headline,bodyHtml,ctaLabel}], features, faqs, trustBadges, footerNote, customBlocks
Rules: pages array MUST include every path from the plan list. features 6–12. faqs 5–8.`,
        },
        {
          role: "user",
          content: `Product idea:\n${input.prompt}\n\nApproved plan (MUST implement):\n${JSON.stringify(
            input.productPlan
              ? {
                  brandName: input.productPlan.brandName,
                  businessModel: input.productPlan.businessModel,
                  pages: input.productPlan.publicPages,
                  modules: input.productPlan.modules,
                  features: input.productPlan.features,
                  trust: input.productPlan.trustCompliance,
                }
              : { pages: pageList }
          )}\n\nInterview:\n${qa || "(thin answers — still fill every plan page)"}${customBlock}\n\nRequired page paths: ${pageList}`,
        },
      ],
    });

    const parsed = parseJsonObject<Partial<GenericAppContent> & { brandName?: string }>(raw);
    if (!parsed.brandName && !planSeed?.brandName) throw new Error("No brandName");

    const city = parsed.city || answerMap(input.answers).city || planSeed?.city || "India";
    const brandName = parsed.brandName || planSeed?.brandName || "App";
    const logo = makeLogo(brandName, city);
    const base =
      planSeed ||
      fallbackGeneric(input.prompt, input.answers, customPoints, extensionId);

    // Prefer LLM pages if they cover enough; else keep plan seed pages
    const llmPages = Array.isArray(parsed.pages) ? parsed.pages : [];
    const useLlmPages = llmPages.length >= Math.min(6, base.pages.length);
    const pages = (
      useLlmPages ? llmPages : base.pages
    ).map((p, i) => ({
      id: String(p.id || `p${i}`).slice(0, 40),
      path: String(p.path || p.id || `page-${i}`)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 32),
      title: String(p.title || "Page").slice(0, 48),
      headline: p.headline ? String(p.headline).slice(0, 120) : undefined,
      bodyHtml: sanitizeShopHtml(String(p.bodyHtml || "<p></p>")),
      ctaLabel: p.ctaLabel ? String(p.ctaLabel).slice(0, 40) : undefined,
    }));

    const content: GenericAppContent = {
      extensionId: extensionId as GenericAppContent["extensionId"],
      appKind: detected.appKind,
      brandName,
      tagline: parsed.tagline || base.tagline,
      description: parsed.description || base.description,
      primaryColor: parsed.primaryColor || base.primaryColor,
      secondaryColor: parsed.secondaryColor || base.secondaryColor,
      accentColor: parsed.accentColor || parsed.primaryColor || base.accentColor,
      themePalette: [
        parsed.primaryColor || base.primaryColor,
        parsed.secondaryColor || base.secondaryColor,
        logo.bgFrom,
        logo.bgTo,
      ],
      city,
      contactEmail: parsed.contactEmail || base.contactEmail,
      contactPhone: parsed.contactPhone || base.contactPhone,
      whatsappNumber: parsed.whatsappNumber || parsed.contactPhone || base.whatsappNumber,
      address: parsed.address,
      heroHeadline: parsed.heroHeadline || base.heroHeadline,
      heroSubheadline: parsed.heroSubheadline || base.heroSubheadline,
      ctaLabel: parsed.ctaLabel || base.ctaLabel,
      secondaryCtaLabel: parsed.secondaryCtaLabel || base.secondaryCtaLabel,
      aboutHtml: sanitizeShopHtml(parsed.aboutHtml || base.aboutHtml),
      logo,
      heroImageUrl: heroImageUrl({
        brandName,
        city,
        whatYouSell: parsed.tagline || input.prompt.slice(0, 80),
        vibe: "modern professional trustworthy",
      }),
      nav:
        Array.isArray(parsed.nav) && parsed.nav.length
          ? parsed.nav.map((n) => ({
              path: String(n.path).slice(0, 32),
              label: String(n.label).slice(0, 32),
            }))
          : pages.map((p) => ({ path: p.path, label: p.title })),
      pages,
      features:
        Array.isArray(parsed.features) && parsed.features.length
          ? parsed.features.slice(0, 12).map((f, i) => ({
              id: String(f.id || `f${i + 1}`),
              title: String(f.title || "Feature").slice(0, 60),
              body: String(f.body || "").slice(0, 280),
              icon: f.icon ? String(f.icon).slice(0, 8) : "✨",
            }))
          : base.features,
      faqs:
        Array.isArray(parsed.faqs) && parsed.faqs.length
          ? parsed.faqs.slice(0, 10).map((f) => ({
              question: String(f.question).slice(0, 160),
              answer: String(f.answer).slice(0, 500),
            }))
          : base.faqs,
      trustBadges: Array.isArray(parsed.trustBadges)
        ? parsed.trustBadges.map((t) => String(t).slice(0, 40)).slice(0, 8)
        : base.trustBadges,
      footerNote: parsed.footerNote || base.footerNote,
      seoTitle: `${brandName} · ${detected.label}`.slice(0, 60),
      seoDescription: (parsed.description || parsed.tagline || input.prompt).slice(0, 160),
      customBlocks: Array.isArray(parsed.customBlocks)
        ? parsed.customBlocks.slice(0, 10).map((b) => ({
            title: String(b.title).slice(0, 60),
            body: String(b.body).slice(0, 400),
          }))
        : base.customBlocks,
    };

    return {
      content,
      generatedBy: `${input.secrets.provider}:${input.secrets.model || "default"}`,
    };
  } catch (e) {
    console.error("[app-builder] generic generate failed:", e);
    if (planSeed) {
      return { content: planSeed, generatedBy: "fallback-plan-seed" };
    }
    return {
      content: fallbackGeneric(input.prompt, input.answers, customPoints, extensionId),
      generatedBy: "fallback-generic",
    };
  }
}
