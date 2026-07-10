/**
 * Dynamic guided interview: Grok acts as PM from the user's product idea.
 * NOT ecom-only — banking, insurance, resume, booking, any vertical.
 * Every question is skippable. Chips MUST match the detected vertical.
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
import {
  ECOM_WORKFLOW_DEFAULTS,
  interviewVerticalKey,
  retargetQuestionsForVertical,
  verticalCoreQuestions,
  type InterviewVerticalKey,
} from "@/lib/app-builder/vertical-interview-cores";

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

const CORE_IDS = ["brandName", "whoFor", "mainJob", "contact", "logoPreference"] as const;

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
  const multiline = Boolean(raw.multiline) || (selectMode === "free" && label.length > 40);

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
    required: false,
    multiline,
    hint: raw.hint ? String(raw.hint).slice(0, 200) : undefined,
    suggestions,
    selectMode,
    allowCustom: raw.allowCustom !== false,
  };
}

function preferredOrderFor(key: InterviewVerticalKey): string[] {
  if (key === "ecom") {
    return [
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
    ];
  }
  if (key === "digital-banking") {
    return [
      "brandName",
      "whoFor",
      "mainJob",
      "mustHaveFeatures",
      "userJourney",
      "trustSafety",
      "successMetric",
      "tone",
      "contact",
      "logoPreference",
    ];
  }
  if (key === "insurance") {
    return [
      "brandName",
      "whoFor",
      "mainJob",
      "mustHaveFeatures",
      "trustSafety",
      "problemSolved",
      "contact",
      "logoPreference",
    ];
  }
  if (key === "resume-career") {
    return [
      "brandName",
      "whoFor",
      "mainJob",
      "mustHaveFeatures",
      "problemSolved",
      "contact",
      "logoPreference",
    ];
  }
  return [
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
}

function ensureCoreQuestions(
  questions: InterviewQuestion[],
  extensionId: string,
  key: InterviewVerticalKey
): InterviewQuestion[] {
  // First kill shop leakage / inject vertical cores
  let retargeted = retargetQuestionsForVertical(questions, key);

  const byId = new Map<string, InterviewQuestion>(
    retargeted.map((q) => [q.id, { ...q, required: false as boolean }])
  );

  const verticalCores = verticalCoreQuestions(key);
  for (const core of verticalCores) {
    const existing = byId.get(core.id);
    if (!existing) {
      byId.set(core.id, { ...core, required: false });
      continue;
    }
    // Always prefer vertical core chips when whoFor/mainJob look wrong or empty
    if (
      (core.id === "whoFor" || core.id === "mainJob") &&
      (!existing.suggestions?.length ||
        /students|shoppers|parents|job seekers/i.test(
          `${existing.helpText || ""} ${(existing.suggestions || []).join(" ")}`
        ))
    ) {
      byId.set(core.id, {
        ...core,
        required: false,
        // Keep a good model-specific label if present
        label:
          existing.label &&
          /bank|insur|career|client|patient|hire|policy|account/i.test(existing.label)
            ? existing.label
            : core.label,
      });
    }
  }

  // Ecom offline workflow only for shops
  if (key === "ecom") {
    for (const wq of ECOM_WORKFLOW_DEFAULTS) {
      if (!byId.has(wq.id)) byId.set(wq.id, { ...wq, required: false });
    }
  }

  const preferredOrder = preferredOrderFor(key);
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

  // Cap length; keep vertical-critical cores first
  return ordered.slice(0, 12);
}

/**
 * Heuristic + vertical cores when LLM is unavailable.
 */
export function fallbackInterviewQuestions(
  prompt: string,
  extensionId: string
): InterviewQuestion[] {
  const detected = detectVerticalFromPrompt(prompt);
  const extId = extensionId || detected.extensionId;
  const key = interviewVerticalKey(extId, detected.appKind);
  const base = verticalCoreQuestions(key);
  const p = prompt.toLowerCase();
  const extras: InterviewQuestion[] = [];

  // Only ecom-specific extras
  if (key === "ecom") {
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
  }

  if (key === "digital-banking" && /loan|credit|emi/i.test(p)) {
    extras.push({
      id: "loanFocus",
      label: "Which money products should the first version highlight?",
      required: false,
      selectMode: "multi",
      allowCustom: true,
      suggestions: [
        "Savings account",
        "UPI / wallet",
        "Debit / credit card",
        "Personal loan",
        "Business account",
        "Fixed deposit",
      ],
    });
  }

  if (key === "insurance" && /health|term|motor|life/i.test(p)) {
    extras.push({
      id: "planTypes",
      label: "Which plan types matter first?",
      required: false,
      selectMode: "multi",
      allowCustom: true,
      suggestions: ["Health", "Term life", "Motor", "Travel", "Family floater"],
    });
  }

  const seen = new Set<string>();
  const merged: InterviewQuestion[] = [];
  for (const q of [...base, ...extras]) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    merged.push({ ...q, required: false });
  }
  return ensureCoreQuestions(merged, extId, key);
}

const PM_SYSTEM = `You are a senior product manager for Verlin Labs App Builder.

## CRITICAL: Understand the PRODUCT from the user's prompt first
The user may build ANYTHING: local shop, digital banking, insurance, resume updater,
booking, portfolio, tuition, SaaS landing, internal tool demo, etc.

## HARD RULE — chips must match the product
- Digital banking / fintech → audience chips like: retail customers, salary accounts, SME owners, NRI, premium banking. NEVER Students, Parents, Job seekers, Everyday customers as shop-style chips.
- Insurance → families, individuals, group cover, seniors. NOT shop delivery chips.
- Resume / career → students/freshers, professionals, career switchers (OK here). NOT shop WhatsApp order.
- Local shop → neighbours, gift buyers, WhatsApp orders — shop chips OK only here.
- Booking → clients, patients, regulars.
If you ask "Who is this for?", the suggestions MUST sound like THIS product's users.

## BAD (for a bank) — never do this
whoFor suggestions: ["Everyday customers", "Students", "Parents", "Business owners", "Job seekers"]
helpText mentioning "Students, shoppers, patients…"

## GOOD (for a bank)
whoFor suggestions: ["Everyday retail customers", "Salary account holders", "SME owners", "NRI", "Premium customers"]
mainJob: open account, UPI payments, view transactions, cards, trust/security
mustHaveFeatures: accounts, transactions, payments, cards, statements, profile

## Rules
- Class-8 English. No jargon (no API, LLM, OAuth, CRM, SKU, omnichannel).
- 6 to 10 questions MAX. Prefer fewer.
- EVERY question is skippable. Set required: false always.
- Prefer chips + allowCustom: true.
- Include soft ids when useful: brandName, whoFor, mainJob, contact, logoPreference.
- Never force offline shop workflow (delivery, stall, WhatsApp orders) for non-shop products.
- helpText = one friendly coach line tailored to THIS product; say they can skip.

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

function verticalChipHint(key: InterviewVerticalKey, label: string): string {
  switch (key) {
    case "digital-banking":
      return `This is DIGITAL BANKING / FINTECH (${label}).
Every chip and helpText must be bank-relevant (accounts, UPI, cards, KYC language simply, trust).
FORBIDDEN chips: Students, Parents, Job seekers, Everyday customers (shop sense), Handmade, Delivery boy.`;
    case "insurance":
      return `This is INSURANCE (${label}). Chips: plans, claims, families, premiums — not shop delivery.`;
    case "resume-career":
      return `This is RESUME / CAREER (${label}). Chips: job seekers, sections, export — not shop catalogue.`;
    case "ecom":
      return `This is a LOCAL SHOP / CATALOGUE (${label}). Shop chips (WhatsApp, delivery, products) are OK.`;
    case "booking":
      return `This is BOOKING / APPOINTMENTS (${label}). Services, slots, clients — not product catalogue unless relevant.`;
    case "tuition":
      return `This is TUITION / COACHING (${label}). Students, parents, batches, fees.`;
    case "portfolio":
      return `This is PORTFOLIO (${label}). Work samples, hire me, clients.`;
    default:
      return `Custom product (${label}). Infer users from the prompt — never default to shop students/parents chips.`;
  }
}

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
  // If user picked ecom explicitly but prompt screams bank, trust prompt
  const key = interviewVerticalKey(
    detected.confidence === "high" ? detected.extensionId : extensionId,
    detected.appKind
  );
  const resolvedExt =
    key === "ecom"
      ? "ecom-local-shop"
      : key === "digital-banking"
        ? "digital-banking"
        : key === "insurance"
          ? "insurance"
          : key === "resume-career"
            ? "resume-career"
            : key === "booking"
              ? "booking-local"
              : key === "tuition"
                ? "tuition-centre"
                : key === "portfolio"
                  ? "portfolio"
                  : extensionId || detected.extensionId;

  const detectedMeta = {
    extensionId: resolvedExt,
    appKind: detected.appKind,
    label: detected.label,
  };

  if (!prompt) {
    return {
      questions: fallbackInterviewQuestions("custom app", resolvedExt),
      designedBy: "fallback-empty-prompt",
      detected: detectedMeta,
    };
  }

  const secrets = input.secrets?.apiKey?.trim()
    ? input.secrets
    : getPlatformAppBuilderSecrets();

  if (!secrets) {
    return {
      questions: fallbackInterviewQuestions(prompt, resolvedExt),
      designedBy: "fallback-no-llm-key",
      rationale: `Understood as: ${detected.label}. Starter questions match this product type (not a generic shop list).`,
      detected: detectedMeta,
    };
  }

  const ext = getExtension(resolvedExt);
  const extensionHint = ext
    ? `Detected product family: ${detected.label} → extension ${resolvedExt} (${ext.plainLabel}). ${ext.description}`
    : `Detected: ${detected.label} (${resolvedExt})`;

  try {
    const raw = await callUserLlm({
      secrets,
      temperature: 0.35,
      maxTokens: 2200,
      timeoutMs: 60_000,
      messages: [
        { role: "system", content: PM_SYSTEM },
        {
          role: "user",
          content: `User's product idea (SOURCE OF TRUTH — understand this deeply):
"""${prompt}"""

${extensionHint}

${verticalChipHint(key, detected.label)}

Design a SHORT guided interview for THIS product only.
- All questions skippable
- Chips tailored ONLY to this vertical
- 6–10 questions
- whoFor chips must not be the generic shop list (Students / Parents / Job seekers) unless this IS education or resume`,
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

    const questions = ensureCoreQuestions(cleaned, resolvedExt, key);
    return {
      questions,
      designedBy: `${secrets.provider}:${secrets.model || defaultModelForProvider(secrets.provider as LlmProviderKind)}`,
      rationale: parsed.rationale?.trim().slice(0, 280),
      detected: detectedMeta,
    };
  } catch (error) {
    console.error("[app-builder] interview design failed:", error);
    return {
      questions: fallbackInterviewQuestions(prompt, resolvedExt),
      designedBy: "fallback-after-llm-error",
      rationale: `AI design failed — using ${detected.label}-specific starter questions (not shop defaults).`,
      detected: detectedMeta,
    };
  }
}
