/**
 * Dynamic guided interview: Grok acts as PM from the user's product idea.
 * NOT ecom-only — banking, insurance, resume, booking, any vertical.
 * Every question is skippable.
 */
import { detectVerticalFromPrompt } from "@/lib/app-builder/detect-vertical";
import { getExtension } from "@/lib/app-builder/extensions";
import { callUserLlm, defaultModelForProvider, parseJsonObject } from "@/lib/app-builder/llm";
import { getPlatformAppBuilderSecrets } from "@/lib/app-builder/platform-llm";
import type {
  AppLlmSecrets,
  InterviewQuestion,
  InterviewSelectMode,
  LlmProviderKind,
} from "@/lib/app-builder/types";

export interface DesignInterviewInput {
  prompt: string;
  extensionId: string;
  /** Prefer caller's key; else platform env keys */
  secrets?: AppLlmSecrets | null;
}

export interface DesignInterviewResult {
  questions: InterviewQuestion[];
  designedBy: string;
  rationale?: string;
  /** Detected product shape from prompt */
  detected?: {
    extensionId: string;
    appKind: string;
    label: string;
  };
}

/** Soft identity fields — optional, never block skip */
const CORE_IDS = ["brandName", "whoFor", "mainJob", "contact", "logoPreference"] as const;

/**
 * Workflow discovery — understand offline business before designing the app.
 * Injected if the PM model omits them.
 */
const WORKFLOW_DEFAULTS: InterviewQuestion[] = [
  {
    id: "offlineDay",
    label: "Walk us through a normal day in your business (offline)",
    helpText:
      "From opening to closing — what do you and your customers actually do? No perfect English needed.",
    required: true,
    multiline: true,
    selectMode: "free",
    suggestions: [
      "Open shop → customers walk in → bill → close",
      "Take orders on phone/WhatsApp → prepare → hand over",
      "Morning prep → peak evening rush → night packing",
      "I work from home; people message when they need something",
    ],
    allowCustom: true,
    placeholder: "e.g. Morning I set the stall… customers ask price… I write in a notebook…",
    hint: "Offline daily workflow for UX and feature design",
  },
  {
    id: "customerSteps",
    label: "When a customer wants to buy or book, what steps happen today?",
    helpText: "Think of the last real customer — what did they do, what did you do?",
    required: true,
    selectMode: "multi",
    suggestions: [
      "They visit the shop",
      "They call or WhatsApp first",
      "They ask price / stock",
      "They choose and pay later or on spot",
      "I note order in diary / WhatsApp chat",
      "Family member helps pack or deliver",
      "They come back another day to collect",
    ],
    allowCustom: true,
    hint: "Current customer journey offline",
  },
  {
    id: "busyTimes",
    label: "When are you busiest?",
    helpText: "Helps us show the right hours, rush offers, and simple wording.",
    required: false,
    selectMode: "multi",
    suggestions: [
      "Morning",
      "Lunch time",
      "Evening",
      "Weekends",
      "Festivals / exam season",
      "Month start (salary days)",
      "Always steady",
    ],
    allowCustom: true,
  },
  {
    id: "whoDoesWhat",
    label: "Who helps run the business day to day?",
    helpText: "So we know if the website needs a simple owner-only flow or space for helpers later.",
    required: false,
    selectMode: "multi",
    suggestions: [
      "Only me",
      "Family member",
      "1–2 staff",
      "Delivery person",
      "I handle WhatsApp myself",
    ],
    allowCustom: true,
  },
  {
    id: "offlinePain",
    label: "What is the hardest part of running this offline today?",
    helpText: "We design the app to ease that pain — not to add tech for its own sake.",
    required: true,
    selectMode: "multi",
    suggestions: [
      "People don’t know my prices / menu",
      "Same questions again and again on phone",
      "Missed WhatsApp messages when busy",
      "Hard to show products without photos",
      "Customers forget my location / hours",
      "Keeping track of orders in chat",
      "Looking more trustable / professional",
    ],
    allowCustom: true,
    hint: "Jobs-to-be-done for the generated app",
  },
  {
    id: "appHelpHope",
    label: "If this website could do only 2–3 things well, what should those be?",
    helpText: "Pick what would actually save time or bring customers — we won’t build everything at once.",
    required: true,
    selectMode: "multi",
    suggestions: [
      "Show products with prices and photos",
      "Let people message / order on WhatsApp easily",
      "Share my link on Instagram or status",
      "Show address, hours, and how to reach me",
      "Look clean so new customers trust me",
      "Take simple orders I can see in one place",
    ],
    allowCustom: true,
    hint: "Priority outcomes for first version of the app",
  },
  // --- Industry-leader patterns (Shopify / Wix / Dukaan / Instamojo) ---
  {
    id: "sellChannel",
    label: "Where do you sell today? (pick all that fit)",
    helpText: "Like Shopify setup: online-only, shop + online, or mainly WhatsApp.",
    required: true,
    selectMode: "multi",
    suggestions: [
      "Physical shop / stall only",
      "Home / kitchen business",
      "WhatsApp / phone orders",
      "Instagram or Facebook",
      "Already sell on a marketplace",
      "I want online for the first time",
    ],
    allowCustom: true,
    hint: "Sales channels — shapes CTA and trust copy",
  },
  {
    id: "uniqueSelling",
    label: "What makes your products or service special?",
    helpText: "Wix-style: one clear reason customers choose you — keep it simple.",
    required: true,
    selectMode: "multi",
    suggestions: [
      "Handmade / homemade",
      "Local & fresh",
      "Better price than nearby shops",
      "Fast WhatsApp reply",
      "Trusted family business for years",
      "Custom / made-to-order",
      "Quality materials",
    ],
    allowCustom: true,
    multiline: true,
    hint: "USP for hero, about, and trust badges",
  },
  {
    id: "shippingHow",
    label: "How do customers get their order?",
    helpText: "Dukaan / Shopify: pickup, local delivery, or courier — we show this clearly on the site.",
    required: true,
    selectMode: "multi",
    suggestions: [
      "Pickup from shop / home",
      "I deliver nearby myself",
      "Delivery boy / partner",
      "Courier to other cities",
      "Digital only (no shipping)",
      "Not sure yet",
    ],
    allowCustom: true,
    hint: "Delivery model for FAQ and order flow",
  },
  {
    id: "paymentToday",
    label: "How do people pay you today?",
    helpText: "India-first like Instamojo: UPI, cash, bank transfer — no heavy payment setup required.",
    required: true,
    selectMode: "multi",
    suggestions: [
      "UPI (GPay / PhonePe / Paytm)",
      "Cash on delivery or at shop",
      "Bank transfer",
      "Card machine at shop",
      "Pay after trying / on credit for regulars",
    ],
    allowCustom: true,
    hint: "Payment methods for FAQ and trust",
  },
  {
    id: "successGoal",
    label: "What does success look like in the next 3 months?",
    helpText: "Shopify-style goal: more enquiries, cleaner catalogue, or fewer phone repeats.",
    required: false,
    selectMode: "multi",
    suggestions: [
      "More WhatsApp enquiries every week",
      "Customers can see prices without asking",
      "Look professional when I share the link",
      "Fewer “are you open?” messages",
      "Take 5–10 online orders a week",
      "Start selling outside my neighbourhood",
    ],
    allowCustom: true,
    hint: "Success metrics for copy tone and CTAs",
  },
  {
    id: "shareWhere",
    label: "Where will you share your shop link first?",
    helpText: "Meesho / Instagram sellers grow by sharing — we prepare copy for those places.",
    required: false,
    selectMode: "multi",
    suggestions: [
      "WhatsApp status / groups",
      "Instagram bio or reels",
      "Facebook page",
      "Printed card / board at shop",
      "Friends and family first",
      "Google Business later",
    ],
    allowCustom: true,
    hint: "Distribution channels for launch checklist",
  },
];

function normalizeId(raw: string, index: number): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return cleaned || `q${index + 1}`;
}

function normalizeSelectMode(raw: unknown): InterviewSelectMode {
  const s = String(raw || "").toLowerCase();
  if (s === "single" || s === "multi" || s === "free") return s;
  return "free";
}

function sanitizeQuestion(raw: Partial<InterviewQuestion>, index: number): InterviewQuestion | null {
  const label = String(raw.label || "").trim();
  if (!label || label.length < 4) return null;

  const id = normalizeId(String(raw.id || label), index);
  const suggestions = Array.isArray(raw.suggestions)
    ? raw.suggestions
        .map((s) => String(s).trim())
        .filter((s) => s.length > 0 && s.length < 80)
        .slice(0, 12)
    : [];

  const selectMode = normalizeSelectMode(raw.selectMode);
  const multiline = Boolean(raw.multiline) || selectMode === "free" && label.length > 40;

  // Strip tech jargon from labels if model slipped
  const safeLabel = label
    .replace(/\b(API|LLM|OAuth|JSON|endpoint|schema|stack)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    id,
    label: safeLabel.slice(0, 160),
    helpText: raw.helpText
      ? String(raw.helpText)
          .replace(/\b(API|LLM|OAuth|JSON|endpoint)\b/gi, "")
          .trim()
          .slice(0, 280)
      : undefined,
    placeholder: raw.placeholder ? String(raw.placeholder).slice(0, 160) : undefined,
    // All questions are skippable — never force required in the UI
    required: false,
    multiline,
    hint: raw.hint ? String(raw.hint).slice(0, 200) : undefined,
    suggestions,
    selectMode,
    allowCustom: raw.allowCustom !== false,
  };
}

function ensureCoreQuestions(
  questions: InterviewQuestion[],
  extensionId: string,
  isEcomLike: boolean
): InterviewQuestion[] {
  const byId = new Map<string, InterviewQuestion>(
    questions.map((q) => [q.id, { ...q, required: false as boolean }])
  );
  const base = getExtension(extensionId)?.questions || [];

  const LOGO_Q: InterviewQuestion = {
    id: "logoPreference",
    label: "Do you already have a logo, or should we design one for you?",
    helpText: "Skip if you want a simple name mark for now.",
    required: false,
    selectMode: "single",
    suggestions: [
      "Please design a logo for me",
      "I will paste my logo link below",
      "Use my name as a simple logo for now",
    ],
    allowCustom: true,
    placeholder: "Or paste https://… link to your logo image",
  };

  for (const coreId of CORE_IDS) {
    if (!byId.has(coreId)) {
      const fromBase = base.find((q) => q.id === coreId);
      if (fromBase) byId.set(coreId, { ...fromBase, required: false });
      else if (coreId === "logoPreference") byId.set(coreId, LOGO_Q);
    }
  }

  // Offline shop workflow only when this is actually a local-shop style product
  if (isEcomLike) {
    for (const wq of WORKFLOW_DEFAULTS) {
      if (!byId.has(wq.id)) byId.set(wq.id, { ...wq, required: false });
    }
  }

  const preferredOrder = isEcomLike
    ? [
        "brandName",
        "city",
        "whoFor",
        "mainJob",
        "sellChannel",
        "offlineDay",
        "customerSteps",
        "uniqueSelling",
        "whatYouSell",
        "shippingHow",
        "paymentToday",
        "contact",
        "logoPreference",
      ]
    : [
        "brandName",
        "whoFor",
        "mainJob",
        "problemSolved",
        "mustHaveFeatures",
        "userJourney",
        "trustSafety",
        "successMetric",
        "tone",
        "contact",
        "logoPreference",
      ];

  const ordered: InterviewQuestion[] = [];
  const take = (id: string) => {
    const q = byId.get(id);
    if (!q) return;
    ordered.push({ ...q, required: false });
    byId.delete(id);
  };

  for (const id of preferredOrder) take(id);
  for (const q of questions) {
    if (byId.has(q.id)) {
      ordered.push({ ...byId.get(q.id)!, required: false });
      byId.delete(q.id);
    }
  }
  for (const q of byId.values()) ordered.push({ ...q, required: false });

  return ordered.slice(0, 12);
}

/**
 * Heuristic + extension template when LLM is unavailable.
 * Still varies slightly by prompt keywords so it is not identical every time.
 */
export function fallbackInterviewQuestions(
  prompt: string,
  extensionId: string
): InterviewQuestion[] {
  const base = getExtension(extensionId)?.questions || [];
  const p = prompt.toLowerCase();
  const extras: InterviewQuestion[] = [];

  if (/student|school|tuition|class|college|exam|notes/.test(p)) {
    extras.push({
      id: "forStudents",
      label: "Is this mainly for school or college students?",
      helpText: "Helps us use simple words parents and students understand.",
      required: false,
      selectMode: "multi",
      suggestions: [
        "School students (6–12)",
        "College students",
        "Parents deciding",
        "Both students and parents",
      ],
      allowCustom: true,
    });
  }

  if (/deliver|home|door|courier/.test(p)) {
    extras.push({
      id: "deliveryArea",
      label: "Where can you deliver or serve?",
      helpText: "Area names are enough — no maps needed.",
      required: false,
      selectMode: "multi",
      suggestions: ["Same neighbourhood only", "Whole city", "Nearby villages", "Pickup only"],
      allowCustom: true,
    });
  }

  if (/wedding|festiv|diwali|gift|hamper/.test(p)) {
    extras.push({
      id: "occasions",
      label: "Which occasions should the shop highlight?",
      required: false,
      selectMode: "multi",
      suggestions: ["Festivals", "Weddings", "Birthdays", "Everyday gifts", "Corporate gifting"],
      allowCustom: true,
    });
  }

  if (/whatsapp|phone|call/.test(p)) {
    extras.push({
      id: "preferChannel",
      label: "What is the easiest way for customers to message you?",
      required: false,
      selectMode: "single",
      suggestions: ["WhatsApp first", "Phone call first", "Either is fine"],
      allowCustom: true,
    });
  }

  if (!base.some((q) => q.id === "logoPreference") && !extras.some((q) => q.id === "logoPreference")) {
    extras.push({
      id: "logoPreference",
      label: "Do you already have a logo, or should we design one for you?",
      helpText: "Skip if you want a simple name mark.",
      required: false,
      selectMode: "single",
      suggestions: [
        "Please design a logo for me",
        "I will paste my logo link below",
        "Use my name as a simple logo for now",
      ],
      allowCustom: true,
      placeholder: "https://… logo image link",
    });
  }

  if (/\b(bank|insurance|resume|cv|booking|portfolio|fintech)\b/i.test(prompt)) {
    extras.push(
      {
        id: "mustHaveFeatures",
        label: "Which features matter most on day one?",
        helpText: "Pick a few. Skip the rest — we can add more later.",
        required: false,
        selectMode: "multi",
        allowCustom: true,
        suggestions: [
          "Clear homepage story",
          "Trust / safety section",
          "Pricing or plans",
          "FAQ",
          "Contact / apply form",
          "How it works steps",
        ],
      },
      {
        id: "problemSolved",
        label: "What problem does this solve for the user?",
        required: false,
        multiline: true,
        selectMode: "free",
        allowCustom: true,
        suggestions: [],
      }
    );
  }

  // Merge base + extras, unique ids
  const seen = new Set<string>();
  const merged: InterviewQuestion[] = [];
  for (const q of [...base, ...extras]) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    merged.push({ ...q, required: false });
  }
  const detected = detectVerticalFromPrompt(prompt);
  const isEcom = detected.extensionId === "ecom-local-shop" || extensionId === "ecom-local-shop";
  return ensureCoreQuestions(merged, extensionId || detected.extensionId, isEcom);
}

const PM_SYSTEM = `You are a senior product manager for Verlin Labs App Builder.

## CRITICAL: Understand the PRODUCT from the user's prompt first
The user may build ANYTHING: local shop, digital banking, insurance, resume updater,
booking, portfolio, tuition, SaaS landing, internal tool demo, etc.
DO NOT assume e-commerce. If they say banking → ask about trust, accounts, KYC language simply.
If resume → ask about job seekers, sections, export. If insurance → plans, claims FAQ.
If shop → products, WhatsApp, delivery. Match questions to THIS idea only.

## Rules
- Class-8 English. No jargon (no API, LLM, OAuth, CRM, SKU, omnichannel).
- 6 to 10 questions MAX. Prefer fewer.
- EVERY question is skippable. Set required: false always.
- Prefer chips + allowCustom: true.
- Include soft ids when useful: brandName, whoFor, mainJob, contact, logoPreference.
- Never force offline shop workflow for non-shop products.
- helpText = one friendly coach line; say they can skip.

Return ONLY valid JSON:
{
  "rationale": "one sentence: what product you understood + why these questions",
  "questions": [
    {
      "id": "camelCase",
      "label": "plain question?",
      "helpText": "optional — you can skip this",
      "placeholder": "optional",
      "required": false,
      "multiline": false,
      "selectMode": "single",
      "suggestions": ["chip1", "chip2"],
      "allowCustom": true,
      "hint": "optional for generation"
    }
  ]
}`;

/**
 * Design interview questions for this prompt (Grok as PM when possible).
 */
export async function designInterviewQuestions(
  input: DesignInterviewInput
): Promise<DesignInterviewResult> {
  const prompt = input.prompt.trim();
  const detected = detectVerticalFromPrompt(prompt);
  const extensionId =
    input.extensionId && input.extensionId !== "ecom-local-shop"
      ? input.extensionId
      : detected.extensionId;
  const isEcom = extensionId === "ecom-local-shop";

  const detectedMeta = {
    extensionId,
    appKind: detected.appKind,
    label: detected.label,
  };

  if (!prompt) {
    return {
      questions: fallbackInterviewQuestions("custom app", extensionId),
      designedBy: "fallback-empty-prompt",
      detected: detectedMeta,
    };
  }

  const secrets = input.secrets?.apiKey?.trim()
    ? input.secrets
    : getPlatformAppBuilderSecrets();

  if (!secrets) {
    return {
      questions: fallbackInterviewQuestions(prompt, extensionId),
      designedBy: "fallback-no-llm-key",
      rationale: `Understood as: ${detected.label}. Starter questions (no AI key for full PM design).`,
      detected: detectedMeta,
    };
  }

  const ext = getExtension(extensionId);
  const extensionHint = ext
    ? `Detected product family: ${detected.label} → extension ${extensionId} (${ext.plainLabel}). ${ext.description}`
    : `Detected: ${detected.label} (${extensionId})`;

  try {
    const raw = await callUserLlm({
      secrets,
      temperature: 0.5,
      maxTokens: 2200,
      timeoutMs: 60_000,
      messages: [
        { role: "system", content: PM_SYSTEM },
        {
          role: "user",
          content: `User's product idea (SOURCE OF TRUTH — understand this deeply):
"""${prompt}"""

${extensionHint}

Design a SHORT guided interview for THIS product only (not a generic shop template).
All questions skippable. Chips tailored to the idea. 6–10 questions.`,
        },
      ],
    });

    const parsed = parseJsonObject<{
      questions?: Partial<InterviewQuestion>[];
      rationale?: string;
    }>(raw);

    const cleaned = (parsed.questions || [])
      .map((q, i) => sanitizeQuestion(q, i))
      .filter((q): q is InterviewQuestion => Boolean(q));

    if (cleaned.length < 3) {
      throw new Error("Too few questions from PM model");
    }

    const questions = ensureCoreQuestions(cleaned, extensionId, isEcom);
    return {
      questions,
      designedBy: `${secrets.provider}:${secrets.model || defaultModelForProvider(secrets.provider as LlmProviderKind)}`,
      rationale: parsed.rationale?.trim().slice(0, 280),
      detected: detectedMeta,
    };
  } catch (error) {
    console.error("[app-builder] interview design failed:", error);
    return {
      questions: fallbackInterviewQuestions(prompt, extensionId),
      designedBy: "fallback-after-llm-error",
      rationale: `AI design failed — using starter questions for: ${detected.label}.`,
      detected: detectedMeta,
    };
  }
}
