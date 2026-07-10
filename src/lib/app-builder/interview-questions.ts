/**
 * Dynamic guided interview: Grok (or free LLM) acts as a product manager
 * and designs simple questions from the user's one-line product idea.
 */
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
}

/** Always present — identity + logo */
const CORE_IDS = ["brandName", "city", "contact", "logoPreference"] as const;

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
    required: raw.required !== false && (CORE_IDS as readonly string[]).includes(id)
      ? true
      : Boolean(raw.required),
    multiline,
    hint: raw.hint ? String(raw.hint).slice(0, 200) : undefined,
    suggestions,
    selectMode,
    allowCustom: raw.allowCustom !== false,
  };
}

function ensureCoreQuestions(
  questions: InterviewQuestion[],
  extensionId: string
): InterviewQuestion[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const base = getExtension(extensionId)?.questions || [];

  const LOGO_Q: InterviewQuestion = {
    id: "logoPreference",
    label: "Do you already have a logo, or should we design one for you?",
    helpText:
      "If you have a logo, paste its web link (from Google Drive, Imgur, etc.). Or tap “Please design a logo for me”.",
    required: true,
    selectMode: "single",
    suggestions: [
      "Please design a logo for me",
      "I will paste my logo link below",
      "Use my shop name as a simple logo for now",
    ],
    allowCustom: true,
    placeholder: "Or paste https://… link to your logo image",
  };

  for (const coreId of CORE_IDS) {
    if (!byId.has(coreId)) {
      const fromBase = base.find((q) => q.id === coreId);
      if (fromBase) byId.set(coreId, fromBase);
      else if (coreId === "logoPreference") byId.set(coreId, LOGO_Q);
    }
  }

  // Ensure workflow discovery questions exist (offline business first)
  for (const wq of WORKFLOW_DEFAULTS) {
    if (!byId.has(wq.id)) byId.set(wq.id, wq);
  }

  // Order: identity → offline workflow → offer → logo → rest
  const preferredOrder = [
    "brandName",
    "city",
    "offlineDay",
    "customerSteps",
    "busyTimes",
    "whoDoesWhat",
    "offlinePain",
    "appHelpHope",
    "whatYouSell",
    "shopType",
    "audience",
    "contact",
    "howToOrder",
    "logoPreference",
  ];

  const ordered: InterviewQuestion[] = [];
  const workflowRequired = new Set([
    "offlineDay",
    "customerSteps",
    "offlinePain",
    "appHelpHope",
  ]);
  const take = (id: string) => {
    const q = byId.get(id);
    if (!q) return;
    const force =
      (CORE_IDS as readonly string[]).includes(id) || workflowRequired.has(id);
    ordered.push(force ? { ...q, required: true } : q);
    byId.delete(id);
  };

  for (const id of preferredOrder) take(id);
  for (const q of questions) {
    if (byId.has(q.id)) {
      ordered.push(byId.get(q.id)!);
      byId.delete(q.id);
    }
  }
  for (const q of byId.values()) ordered.push(q);

  return ordered.slice(0, 14);
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
      helpText: "Paste a logo link, or ask us to design one that matches your city and products.",
      required: true,
      selectMode: "single",
      suggestions: [
        "Please design a logo for me",
        "I will paste my logo link below",
        "Use my shop name as a simple logo for now",
      ],
      allowCustom: true,
      placeholder: "https://… logo image link",
    });
  }

  // Merge base + extras, unique ids
  const seen = new Set<string>();
  const merged: InterviewQuestion[] = [];
  for (const q of [...base, ...extras]) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    merged.push(q);
  }
  return ensureCoreQuestions(merged, extensionId);
}

const PM_SYSTEM = `You are a senior product manager for Verlin Labs App Builder.
You interview people who are NOT technical (parents, local shop owners, home bakers, tuition teachers in India).

## Your job (in this order)
1. Understand their OFFLINE business first — a real day, real customer steps, who helps, when busy, what is hard.
2. Only then ask about name, place, products, contact, logo.
3. Design questions so WE can build an app that matches how they already work — not a fancy website they will not use.

## Discovery themes (cover most of these with simple words)
- A normal offline day / week (open → customers → close)
- What a customer does step-by-step today (walk-in, call, WhatsApp, notebook)
- Busy times (festivals, evenings, exam season…)
- Who runs the work (only me / family / staff)
- What is painful offline (repeat questions, no photos, missed chats, trust)
- What 2–3 jobs the website must do first
- What they sell / offer (concrete names for photos later)
- Who buys, how they pay or order today
- Name, city, contact, logo choice

## Rules for every question
- Class-8 English. No jargon: no API, LLM, stack, OAuth, CRM, SKU, deploy, workflow engine.
- Prefer chips (suggestions). Always allowCustom: true.
- 9 to 12 questions total. Not more than 14.
- Mix selectMode: "single" | "multi" | "free". Use multiline free text for "describe your day".
- required: true for brandName, city, contact, logoPreference, and at least the offline day + customer steps + main pain + hoped app help.
- MUST include exact ids: brandName, city, contact, logoPreference.
- MUST include workflow-style questions (you may use ids offlineDay, customerSteps, busyTimes, whoDoesWhat, offlinePain, appHelpHope OR invent better ids that fit the idea — but keep the same intent).
- logoPreference: include "Please design a logo for me" and option to paste a logo link.
- Tailor chips to THIS product idea (prompt). A pottery shop and a tuition class get different day-in-the-life chips.
- helpText = friendly coach line (1 sentence), like you are sitting with them at their shop.

Return ONLY valid JSON:
{
  "rationale": "one short sentence: what offline workflow you are trying to learn",
  "questions": [
    {
      "id": "camelOr_snake",
      "label": "plain question?",
      "helpText": "optional coach line",
      "placeholder": "optional",
      "required": true,
      "multiline": false,
      "selectMode": "single",
      "suggestions": ["chip1", "chip2"],
      "allowCustom": true,
      "hint": "optional note for later website generation"
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
  if (!prompt) {
    return {
      questions: fallbackInterviewQuestions("local shop", input.extensionId),
      designedBy: "fallback-empty-prompt",
    };
  }

  const secrets = input.secrets?.apiKey?.trim()
    ? input.secrets
    : getPlatformAppBuilderSecrets();

  if (!secrets) {
    return {
      questions: fallbackInterviewQuestions(prompt, input.extensionId),
      designedBy: "fallback-no-llm-key",
      rationale: "Using smart starter questions (no AI key available for product-manager design).",
    };
  }

  const ext = getExtension(input.extensionId);
  const extensionHint = ext
    ? `Product shape: ${ext.plainLabel || ext.label} (${ext.id}). ${ext.description}`
    : `Product shape id: ${input.extensionId}`;

  try {
    const raw = await callUserLlm({
      secrets,
      temperature: 0.55,
      maxTokens: 2500,
      timeoutMs: 60_000,
      messages: [
        { role: "system", content: PM_SYSTEM },
        {
          role: "user",
          content: `User's product idea (one prompt):
"""${prompt}"""

${extensionHint}

Design the guided interview NOW.
Priority: first understand how this business works OFFLINE (day, customer steps, busy times, who helps, pains, what success looks like), THEN name/city/products/contact/logo.
Every chip and question must fit THIS idea. Speak like a product manager sitting with a non-tech owner.`,
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

    if (cleaned.length < 4) {
      throw new Error("Too few questions from PM model");
    }

    const questions = ensureCoreQuestions(cleaned, input.extensionId);
    return {
      questions,
      designedBy: `${secrets.provider}:${secrets.model || defaultModelForProvider(secrets.provider as LlmProviderKind)}`,
      rationale: parsed.rationale?.trim().slice(0, 280),
    };
  } catch (error) {
    console.error("[app-builder] interview design failed:", error);
    return {
      questions: fallbackInterviewQuestions(prompt, input.extensionId),
      designedBy: "fallback-after-llm-error",
      rationale: "AI design failed — using tailored starter questions from your idea keywords.",
    };
  }
}
