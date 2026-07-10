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

const CORE_IDS = ["brandName", "city", "contact", "logoPreference"] as const;

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

  // Prefer order: brandName, city, then rest (deduped)
  const ordered: InterviewQuestion[] = [];
  for (const id of CORE_IDS) {
    const q = byId.get(id);
    if (q) {
      ordered.push({ ...q, required: true });
      byId.delete(id);
    }
  }
  for (const q of questions) {
    if (byId.has(q.id)) {
      ordered.push(byId.get(q.id)!);
      byId.delete(q.id);
    }
  }
  for (const q of byId.values()) ordered.push(q);

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
You design SHORT guided interviews for people who are NOT technical
(school students' parents, local shop owners, first-time founders in India).

Rules for every question:
- Use simple everyday words (Class 8 English is fine). No jargon: no API, LLM, stack, OAuth, CRM, SKU, deploy.
- Prefer tap-to-answer suggestions (chips) so users can answer fast.
- Always allow custom answers (allowCustom: true).
- 7 to 10 questions total. Not more than 12.
- Mix selectMode: "single" | "multi" | "free".
- required: true only for name, place, contact, and the main offer.
- MUST include questions with ids: brandName, city, contact, logoPreference (use exactly those ids).
- logoPreference: ask if they want US to design a logo OR they will share a logo link. Suggestions must include "Please design a logo for me" and a paste-link option.
- Tailor EVERY question and suggestion chip to the user's product idea (prompt). Do not use a generic fixed list.
- Suggestions must feel local and practical (WhatsApp, UPI, neighbourhood, festivals when relevant).
- Ask about products/services in a way that helps us create matching photos later (concrete names).
- helpText is a friendly coach line (1 sentence).

Return ONLY valid JSON:
{
  "rationale": "one short sentence why these questions fit the idea",
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
          content: `User's product idea (one prompt):\n"""${prompt}"""\n\n${extensionHint}\n\nDesign the guided interview now. Every chip and question must fit THIS idea.`,
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
