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

export type BuildProgressEvent = {
  phase: "shell" | "pages" | "done";
  message: string;
  completed?: number;
  total?: number;
};

export type BuildProgressFn = (event: BuildProgressEvent) => void;

const PAGE_BATCH_SIZE = 4;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function normalizePage(p: Partial<GenericAppPage> & Record<string, unknown>, i: number): GenericAppPage {
  return {
    id: String(p.id || `p${i}`).slice(0, 40),
    path: String(p.path || p.id || `page-${i}`)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 32),
    title: String(p.title || "Page").slice(0, 48),
    headline: p.headline ? String(p.headline).slice(0, 120) : undefined,
    bodyHtml: sanitizeShopHtml(String(p.bodyHtml || "<p></p>")),
    ctaLabel: p.ctaLabel ? String(p.ctaLabel).slice(0, 40) : undefined,
  };
}

/**
 * Write real copy for a small batch of pages (3-4 at a time) instead of asking
 * the LLM for an entire multi-page site in one completion. Large plans (15-20
 * pages) blow past a single call's token budget, the JSON gets truncated, and
 * the whole build used to silently fall back to raw plan-outline placeholder
 * text. Batching keeps each call comfortably inside its token/time budget and
 * lets one bad batch fail without dragging the rest of the site down with it.
 */
async function generatePageBatch(params: {
  secrets: AppLlmSecrets;
  detectedLabel: string;
  appKind: string;
  brandName: string;
  prompt: string;
  qa: string;
  customBlock: string;
  seedPages: GenericAppPage[];
}): Promise<GenericAppPage[]> {
  const pageBrief = params.seedPages
    .map((p) => `- path:"${p.path}" title:"${p.title}" purpose:"${p.headline || p.title}"`)
    .join("\n");

  const raw = await callUserLlm({
    secrets: params.secrets,
    temperature: 0.35,
    maxTokens: 2200,
    timeoutMs: 55_000,
    messages: [
      {
        role: "system",
        content: `You write real page content for a ${params.detectedLabel} (${params.appKind}) product called "${params.brandName}", built by Verlin Labs App Builder.
Write ONLY the pages listed below — do not add or skip any.
For banking/fintech authenticated pages (dashboard, transfer, cards, statements, profile): describe a realistic mocked demo screen — actual balances, sample transaction rows, named quick actions — not vague marketing copy.
For insurance authenticated pages (quote, claims): describe the real step-by-step flow with sample numbers.
Class-8 English. No fake licence/registration numbers.

You are encouraged to write interactive UI elements styled with Tailwind classes (e.g. rounded-xl, shadow, p-4, border, bg-card, text-primary, bg-primary, etc.) in the bodyHtml, such as:
1. Buttons & Links with Actions:
   - Page Navigation: <button data-action="navigate" data-target="[page-path]" class="...">Navigate</button>
   - Quick Send (mutates checking balance): <button data-action="quick-send" data-recipient="John" data-amount="500" class="...">Send ₹500 to John</button>
   - Card Lock Toggle: <button data-action="toggle-card" class="...">Lock/Unlock Card</button>
2. Forms with Actions:
   - Money Transfer Form: <form data-action="transfer-form" class="space-y-4"> containing inputs like <input name="recipient" type="text" class="...">, <input name="amount" type="number" class="...">, and a submit button.
3. State placeholders that are dynamically replaced:
   - {{balanceChecking}} (renders checking balance, e.g. ₹12,500.50)
   - {{balanceSavings}} (renders savings balance, e.g. ₹45,000.00)
   - {{userName}} (user's name)
   - {{userEmail}} (user's email)
   - {{userPhone}} (user's phone number)
   - {{cardStatus}} (Active or Locked)
   - {{transactionsList}} (HTML list of recent transactions)

Return ONLY JSON: {"pages":[{"path":"...","id":"...","title":"...","headline":"...","bodyHtml":"...","ctaLabel":"..."}]}
Every bodyHtml must be substantive: 3-6 sentences, a styled card layout, or a form, not a one-liner.`,
      },
      {
        role: "user",
        content: `Product idea:\n${params.prompt}\n\nPages to write (exactly these, same paths):\n${pageBrief}\n\nInterview notes:\n${params.qa || "(thin answers — write sensible defaults)"}${params.customBlock}`,
      },
    ],
  });

  const parsed = parseJsonObject<{ pages?: Array<Partial<GenericAppPage>> }>(raw);
  const llmPages = Array.isArray(parsed.pages) ? parsed.pages : [];
  if (!llmPages.length) throw new Error("Batch returned no pages");

  // Keep original order/paths from the seed batch; match LLM output by path where possible.
  return params.seedPages.map((seed, i) => {
    const match = llmPages.find((p) => (p.path || "").toLowerCase() === seed.path) || llmPages[i];
    return match ? normalizePage(match, i) : seed;
  });
}

export async function generateGenericAppContent(input: {
  extensionId: AppExtensionId;
  prompt: string;
  answers: AppInterviewAnswer[];
  customPoints?: string[];
  secrets: AppLlmSecrets;
  productPlan?: ProductPlan;
  seedContent?: GenericAppContent;
  onProgress?: BuildProgressFn;
}): Promise<{ content: GenericAppContent; generatedBy: string }> {
  const customPoints = input.customPoints || [];
  const detected = detectVerticalFromPrompt(input.prompt);
  const extensionId =
    input.extensionId === "ecom-local-shop" ? "generic-app" : input.extensionId;
  const emit = input.onProgress || (() => {});

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

  const base =
    planSeed || fallbackGeneric(input.prompt, input.answers, customPoints, extensionId);
  let generatedBy = "fallback-plan-seed";

  try {
    // 1. Shell: brand identity, hero, nav, features, faqs — small, fast, single call.
    emit({ phase: "shell", message: "Writing brand identity, hero copy, and navigation…" });
    const pageList = base.pages.map((p) => `${p.path}: ${p.title}`).join(", ");
    const shellRaw = await callUserLlm({
      secrets: input.secrets,
      temperature: 0.4,
      maxTokens: 2400,
      timeoutMs: 45_000,
      messages: [
        {
          role: "system",
          content: `You write the brand shell for a ${detected.label} (${detected.appKind}) product built by Verlin Labs App Builder.
You MUST reflect the APPROVED PRODUCT PLAN pages in "nav" — do not collapse to 3 marketing pages.
Class-8 English. No fake licence numbers. aboutHtml may ONLY use <p>/<ul>/<li>/<strong>/<em> tags.
Return ONLY JSON with: brandName, tagline, description, primaryColor, secondaryColor, city, contactEmail, contactPhone,
heroHeadline, heroSubheadline, ctaLabel, secondaryCtaLabel, aboutHtml, nav[{path,label}], features[{id,title,body,icon}] (6-12),
faqs[{question,answer}] (5-8), trustBadges (string array), footerNote, customBlocks[{title,body}].
Do NOT include a "pages" field — page content is written separately.`,
        },
        {
          role: "user",
          content: `Product idea:\n${input.prompt}\n\nApproved plan pages (reflect in nav):\n${pageList}\n\nInterview:\n${qa || "(thin answers)"}${customBlock}`,
        },
      ],
    });
    const shell = parseJsonObject<Partial<GenericAppContent>>(shellRaw);
    if (!shell.brandName && !base.brandName) throw new Error("No brandName");
    generatedBy = `${input.secrets.provider}:${input.secrets.model || "default"}`;

    const city = shell.city || answerMap(input.answers).city || base.city || "India";
    const brandName = shell.brandName || base.brandName || "App";
    const logo = makeLogo(brandName, city);

    // 2. Pages: batch in small groups so token/time budget is never a cliff-edge.
    const batches = chunk(base.pages, PAGE_BATCH_SIZE);
    const pageResults: GenericAppPage[] = [];
    let anyBatchSucceeded = false;
    let completed = 0;
    for (const batch of batches) {
      emit({
        phase: "pages",
        message: `Writing content — ${completed} of ${base.pages.length} pages done…`,
        completed,
        total: base.pages.length,
      });
      try {
        const written = await generatePageBatch({
          secrets: input.secrets,
          detectedLabel: detected.label,
          appKind: detected.appKind,
          brandName,
          prompt: input.prompt,
          qa,
          customBlock,
          seedPages: batch,
        });
        pageResults.push(...written);
        anyBatchSucceeded = true;
      } catch (batchErr) {
        console.error("[app-builder] page batch failed, using plan-seed text for this batch:", batchErr);
        pageResults.push(...batch);
      }
      completed += batch.length;
    }
    if (!anyBatchSucceeded) generatedBy = "fallback-plan-seed";
    emit({
      phase: "pages",
      message: `Writing content — ${base.pages.length} of ${base.pages.length} pages done.`,
      completed: base.pages.length,
      total: base.pages.length,
    });

    const parsed = shell;
    const pages = pageResults;

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

    emit({ phase: "done", message: "Content ready." });
    return { content, generatedBy };
  } catch (e) {
    console.error("[app-builder] generic generate failed:", e);
    if (planSeed) {
      emit({ phase: "done", message: "Content ready (used plan defaults)." });
      return { content: planSeed, generatedBy: "fallback-plan-seed" };
    }
    emit({ phase: "done", message: "Content ready (used defaults)." });
    return {
      content: fallbackGeneric(input.prompt, input.answers, customPoints, extensionId),
      generatedBy: "fallback-generic",
    };
  }
}
