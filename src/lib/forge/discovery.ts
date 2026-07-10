/**
 * Adaptive Discovery engine — archetype-aware question batches.
 * Progressive 3–5 questions per round; stops when enough signal for a plan.
 */

import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";
import type { AppLlmSecrets, InterviewQuestion } from "@/lib/app-builder/types";
import { classifyProductIdea } from "@/lib/forge/archetypes";
import type {
  DiscoveryAnswer,
  DiscoveryBatch,
  ForgeDomain,
  ProductArchetype,
} from "@/lib/forge/types";

function sanitizeQuestion(raw: Partial<InterviewQuestion>, index: number): InterviewQuestion | null {
  const label = String(raw.label || "").trim();
  if (!label || label.length < 4) return null;
  const id =
    String(raw.id || `q${index + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40) || `q${index + 1}`;

  const suggestions = Array.isArray(raw.suggestions)
    ? raw.suggestions
        .map((s) => String(s).trim())
        .filter((s) => s.length > 0 && s.length < 90)
        .slice(0, 10)
    : [];

  const mode = String(raw.selectMode || "single").toLowerCase();
  const selectMode =
    mode === "multi" || mode === "free" || mode === "single" ? mode : "single";

  return {
    id,
    label: label
      .replace(/\b(API|LLM|OAuth|JSON|endpoint|schema|stack)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160),
    helpText: raw.helpText
      ? String(raw.helpText)
          .replace(/\b(API|LLM|OAuth|JSON)\b/gi, "")
          .trim()
          .slice(0, 240)
      : undefined,
    placeholder: raw.placeholder ? String(raw.placeholder).slice(0, 120) : undefined,
    required: false,
    multiline: Boolean(raw.multiline) || selectMode === "free",
    suggestions,
    selectMode: selectMode as InterviewQuestion["selectMode"],
    allowCustom: raw.allowCustom !== false,
  };
}

/** Dimension → question templates by archetype (rule fallback when no LLM) */
function fallbackQuestions(
  archetype: ProductArchetype,
  domain: ForgeDomain,
  prompt: string,
  answeredIds: Set<string>,
  batchIndex: number
): InterviewQuestion[] {
  const banks: Record<string, InterviewQuestion[]> = {
    booking: [
      {
        id: "brandName",
        label: "What should we call this product?",
        selectMode: "free",
        suggestions: ["Studio Book", "ClassFlow", "My Studio"],
        allowCustom: true,
      },
      {
        id: "classTypes",
        label: "What do people book — classes, appointments, or rooms?",
        selectMode: "multi",
        suggestions: ["Group classes", "1:1 sessions", "Workshops", "Room hire"],
        allowCustom: true,
      },
      {
        id: "instructors",
        label: "Who delivers the sessions?",
        selectMode: "single",
        suggestions: ["Just me", "A few instructors", "Many staff", "Resources only (rooms)"],
        allowCustom: true,
      },
      {
        id: "paymentModel",
        label: "How do people pay?",
        selectMode: "multi",
        suggestions: [
          "Memberships",
          "Drop-in / pay per class",
          "Packages of credits",
          "Free booking (pay offline)",
        ],
        allowCustom: true,
      },
      {
        id: "cancellation",
        label: "Any cancellation rules we should bake in?",
        selectMode: "single",
        suggestions: [
          "Cancel free until 12h before",
          "Cancel free until 24h before",
          "No online cancel — message us",
          "Flexible — no strict window",
        ],
        allowCustom: true,
      },
      {
        id: "whoBooks",
        label: "Who books — members only, or anyone?",
        selectMode: "single",
        suggestions: ["Anyone (guest ok)", "Members only", "Members + guests", "Staff books for clients"],
        allowCustom: true,
      },
    ],
    tracker: [
      {
        id: "brandName",
        label: "What should we call this tracker?",
        selectMode: "free",
        suggestions: ["Team Expenses", "ClaimTrack", "SpendLog"],
        allowCustom: true,
      },
      {
        id: "whatTracked",
        label: "What is being tracked?",
        selectMode: "multi",
        suggestions: ["Expenses", "Time", "Inventory", "Habits", "Mileage"],
        allowCustom: true,
      },
      {
        id: "approvalFlow",
        label: "Is there an approval workflow?",
        selectMode: "single",
        suggestions: [
          "Manager must approve",
          "Auto-approve under a limit",
          "No approval needed",
          "Multi-step (manager then finance)",
        ],
        allowCustom: true,
      },
      {
        id: "categories",
        label: "Which categories matter most?",
        selectMode: "multi",
        suggestions: ["Travel", "Meals", "Software", "Office", "Client entertainment"],
        allowCustom: true,
      },
      {
        id: "receipts",
        label: "Do people need to upload receipts or files?",
        selectMode: "single",
        suggestions: ["Yes — required", "Optional", "No uploads"],
        allowCustom: true,
      },
      {
        id: "visibility",
        label: "Who can see whose records?",
        selectMode: "single",
        suggestions: [
          "Only me + my manager",
          "Whole team can see all",
          "Finance sees all; others only own",
          "Strict — only admins see all",
        ],
        allowCustom: true,
      },
    ],
    ecommerce: [
      {
        id: "brandName",
        label: "Shop name?",
        selectMode: "free",
        suggestions: [],
        allowCustom: true,
        placeholder: "e.g. Jaipur Crafts Co.",
      },
      {
        id: "whatYouSell",
        label: "What do you sell?",
        selectMode: "free",
        suggestions: ["Handmade goods", "Food & groceries", "Fashion", "Services + products"],
        allowCustom: true,
        multiline: true,
      },
      {
        id: "orderChannel",
        label: "How should customers order?",
        selectMode: "multi",
        suggestions: ["WhatsApp", "Online cart", "Call", "In-store pickup"],
        allowCustom: true,
      },
      {
        id: "payments",
        label: "How do they pay?",
        selectMode: "multi",
        suggestions: ["UPI", "Cash on delivery", "Card online", "Pay later"],
        allowCustom: true,
      },
      {
        id: "city",
        label: "Which city / area?",
        selectMode: "free",
        suggestions: ["Jaipur", "Delhi NCR", "Mumbai", "Bengaluru"],
        allowCustom: true,
      },
    ],
    marketplace: [
      {
        id: "brandName",
        label: "Marketplace name?",
        selectMode: "free",
        allowCustom: true,
        suggestions: ["CraftBay", "LocalMakers", "Handmade Hub"],
      },
      {
        id: "twoSides",
        label: "Who are the two sides of the market?",
        selectMode: "free",
        suggestions: ["Artisans & buyers", "Hosts & guests", "Freelancers & clients"],
        allowCustom: true,
      },
      {
        id: "listings",
        label: "What gets listed?",
        selectMode: "single",
        suggestions: ["Products", "Services", "Both", "Rentals"],
        allowCustom: true,
      },
      {
        id: "payments",
        label: "How do payments work?",
        selectMode: "single",
        suggestions: [
          "Platform takes payment",
          "Pay seller directly",
          "Offline only",
          "Escrow-style hold",
        ],
        allowCustom: true,
      },
      {
        id: "trust",
        label: "What builds trust?",
        selectMode: "multi",
        suggestions: ["Reviews", "Verified sellers", "Messaging", "Refund policy"],
        allowCustom: true,
      },
    ],
    crm: [
      {
        id: "brandName",
        label: "CRM name?",
        selectMode: "free",
        suggestions: ["Pipeline", "LeadDesk", "DealFlow"],
        allowCustom: true,
      },
      {
        id: "whoUses",
        label: "Who will use this day to day?",
        selectMode: "multi",
        suggestions: ["Sales reps", "Managers", "Founders only", "Support"],
        allowCustom: true,
      },
      {
        id: "pipeline",
        label: "What stages should a deal move through?",
        selectMode: "free",
        suggestions: ["New → Contacted → Proposal → Won/Lost", "Lead → Qualified → Closed"],
        allowCustom: true,
        multiline: true,
      },
      {
        id: "entities",
        label: "What records matter most?",
        selectMode: "multi",
        suggestions: ["Leads", "Companies", "Contacts", "Deals", "Tasks"],
        allowCustom: true,
      },
    ],
    education: [
      {
        id: "brandName",
        label: "Centre / product name?",
        selectMode: "free",
        allowCustom: true,
        suggestions: [],
      },
      {
        id: "whoFor",
        label: "Who are the learners?",
        selectMode: "single",
        suggestions: ["School kids", "College students", "Working adults", "Mixed"],
        allowCustom: true,
      },
      {
        id: "offerings",
        label: "What do you offer?",
        selectMode: "multi",
        suggestions: ["Batches", "1:1 tutoring", "Online classes", "Study materials"],
        allowCustom: true,
      },
      {
        id: "fees",
        label: "How do fees work?",
        selectMode: "single",
        suggestions: ["Monthly fee", "Per course", "Per session", "Mixed"],
        allowCustom: true,
      },
    ],
    default: [
      {
        id: "brandName",
        label: "What should we call this product?",
        selectMode: "free",
        allowCustom: true,
        suggestions: [],
        placeholder: "A short brand name",
      },
      {
        id: "whoFor",
        label: "Who is this mainly for?",
        selectMode: "multi",
        suggestions: ["Customers", "My team", "Both", "Students", "Businesses"],
        allowCustom: true,
      },
      {
        id: "mainJob",
        label: "What is the #1 job people should finish in the app?",
        selectMode: "free",
        allowCustom: true,
        multiline: true,
        suggestions: [],
        placeholder: "e.g. book a slot, log an expense, buy a product",
      },
      {
        id: "needLogin",
        label: "Do people need to log in?",
        selectMode: "single",
        suggestions: ["Yes — different roles", "Yes — simple account", "No login for v1", "Staff only login"],
        allowCustom: true,
      },
      {
        id: "mustHaves",
        label: "What must be in the first version?",
        selectMode: "multi",
        suggestions: ["Core workflow", "Admin view", "Notifications", "Reports", "Payments"],
        allowCustom: true,
      },
    ],
  };

  const key =
    archetype === "booking"
      ? "booking"
      : archetype === "tracker"
        ? "tracker"
        : archetype === "ecommerce"
          ? "ecommerce"
          : archetype === "marketplace"
            ? "marketplace"
            : archetype === "crm"
              ? "crm"
              : archetype === "education"
                ? "education"
                : "default";

  // Domain tweak: fitness booking already covered; finance tracker already covered
  void domain;
  void prompt;

  const all = banks[key] || banks.default;
  const remaining = all.filter((q) => !answeredIds.has(q.id));
  const start = Math.min(batchIndex * 3, Math.max(0, remaining.length - 1));
  return remaining.slice(start, start + 4);
}

function smartDefaultFor(
  q: InterviewQuestion,
  archetype: ProductArchetype,
  prompt: string
): string {
  const id = q.id.toLowerCase();
  if (id.includes("brand") || id.includes("name")) {
    const m = prompt.match(/(?:called|named)\s+["']?([A-Za-z0-9 &-]{2,40})/i);
    return m?.[1] || q.suggestions?.[0] || "My App";
  }
  if (id.includes("payment") || id.includes("pay")) {
    if (archetype === "booking") return "Memberships, Drop-in / pay per class";
    if (archetype === "ecommerce") return "UPI, Cash on delivery";
    return q.suggestions?.[0] || "Pay online or offline";
  }
  if (id.includes("cancel")) return "Cancel free until 12h before";
  if (id.includes("approval")) return "Manager must approve";
  if (id.includes("receipt")) return "Optional";
  if (id.includes("visibility") || id.includes("who can see"))
    return "Only me + my manager";
  if (id.includes("login") || id.includes("auth")) return "Yes — different roles";
  if (id.includes("instructor")) return "A few instructors";
  if (q.suggestions?.length) return q.suggestions[0];
  return "Use a simple default for v1";
}

function computeProgress(
  answers: DiscoveryAnswer[],
  batchesAsked: number,
  completeFlag: boolean
): number {
  if (completeFlag) return 100;
  const meaningful = answers.filter((a) => a.answer.trim() && !a.skipped).length;
  // Aim for ~6–8 solid answers or 2 batches
  const byAnswers = Math.min(90, Math.round((meaningful / 7) * 100));
  const byBatch = Math.min(90, batchesAsked * 45);
  return Math.max(byAnswers, byBatch, meaningful > 0 ? 15 : 5);
}

function shouldComplete(
  answers: DiscoveryAnswer[],
  batchesAsked: number,
  llmSaysComplete?: boolean
): boolean {
  if (llmSaysComplete) return true;
  const meaningful = answers.filter((a) => a.answer.trim() && !a.skipped).length;
  if (batchesAsked >= 2 && meaningful >= 4) return true;
  if (meaningful >= 8) return true;
  if (batchesAsked >= 3) return true;
  return false;
}

function buildUnderstanding(
  prompt: string,
  archetype: ProductArchetype,
  domain: ForgeDomain,
  answers: DiscoveryAnswer[]
): string {
  const bits = answers
    .filter((a) => a.answer.trim() && !a.skipped)
    .map((a) => `${a.question}: ${a.answer}`)
    .slice(0, 12);
  return [
    `Idea: ${prompt.slice(0, 200)}`,
    `Type: ${archetype.replace(/_/g, " ")} · Domain: ${domain}`,
    bits.length ? `Known: ${bits.join(" · ")}` : "Still gathering details.",
  ].join("\n");
}

export async function runDiscoveryBatch(input: {
  prompt: string;
  priorAnswers?: DiscoveryAnswer[];
  batchIndex?: number;
  secrets?: AppLlmSecrets | null;
  /** User asked to finish interview early */
  forceComplete?: boolean;
}): Promise<DiscoveryBatch> {
  const prompt = input.prompt.trim();
  const prior = input.priorAnswers || [];
  const batchIndex = input.batchIndex ?? Math.floor(prior.length > 0 ? 1 : 0);
  const classification = classifyProductIdea(prompt);
  const answeredIds = new Set(prior.map((a) => a.questionId));

  if (input.forceComplete || shouldComplete(prior, batchIndex, false)) {
    return {
      batchIndex,
      questions: [],
      progress: 100,
      complete: true,
      rationale: "Enough detail to draft a solid plan.",
      archetype: classification.archetype,
      domain: classification.domain,
      understanding: buildUnderstanding(
        prompt,
        classification.archetype,
        classification.domain,
        prior
      ),
      designedBy: "discovery:complete",
    };
  }

  const secrets = input.secrets?.apiKey?.trim()
    ? input.secrets
    : resolveAppBuilderSecrets();

  if (secrets) {
    try {
      const raw = await callUserLlm({
        secrets,
        temperature: 0.4,
        maxTokens: 2200,
        timeoutMs: 45_000,
        messages: [
          {
            role: "system",
            content: `You are Forge's discovery PM. You interview non-technical users to design a product plan.

Rules:
- Questions MUST be specific to THIS product idea, archetype, and domain — never generic boilerplate already answered by the prompt.
- A yoga booking app asks about classes, instructors, membership vs drop-in, cancellation — NOT expense categories.
- An expense tracker asks about approvals, categories, receipts, visibility — NOT class schedules.
- 3–5 questions per batch. Plain Class-8 English. No tech jargon (no API, OAuth, schema).
- Prefer multiple-choice chips (selectMode single|multi) with 4–8 short options + allowCustom true.
- Never re-ask something already answered.
- After enough signal (usually 1–2 batches), set complete=true and questions=[].
- Update understanding as a short paragraph of what you believe the product is.

Return ONLY JSON:
{
  "questions": [{ "id", "label", "helpText?", "selectMode", "suggestions", "allowCustom", "multiline?" }],
  "complete": boolean,
  "progress": 0-100,
  "rationale": string,
  "understanding": string
}`,
          },
          {
            role: "user",
            content: JSON.stringify({
              prompt,
              classification: {
                archetype: classification.archetype,
                domain: classification.domain,
                dimensions: classification.dimensions,
                label: classification.label,
              },
              priorAnswers: prior.map((a) => ({
                id: a.questionId,
                q: a.question,
                a: a.answer,
                skipped: a.skipped,
                usedDefault: a.usedDefault,
              })),
              batchIndex,
              alreadyAskedIds: [...answeredIds],
              task: "Produce the next discovery batch OR mark complete if enough for a plan.",
            }),
          },
        ],
      });

      const parsed = parseJsonObject<{
        questions?: Partial<InterviewQuestion>[];
        complete?: boolean;
        progress?: number;
        rationale?: string;
        understanding?: string;
      }>(raw);

      const questions = (parsed.questions || [])
        .map((q, i) => sanitizeQuestion(q, i))
        .filter((q): q is InterviewQuestion => Boolean(q))
        .filter((q) => !answeredIds.has(q.id))
        .slice(0, 5);

      const complete =
        Boolean(parsed.complete) ||
        questions.length === 0 ||
        shouldComplete(prior, batchIndex + 1, parsed.complete);

      return {
        batchIndex,
        questions: complete ? [] : questions,
        progress: complete
          ? 100
          : Math.min(
              95,
              Math.max(
                computeProgress(prior, batchIndex, false),
                Number(parsed.progress) || 40
              )
            ),
        complete,
        rationale: parsed.rationale || classification.label,
        archetype: classification.archetype,
        domain: classification.domain,
        understanding:
          parsed.understanding ||
          buildUnderstanding(
            prompt,
            classification.archetype,
            classification.domain,
            prior
          ),
        designedBy: "llm",
      };
    } catch (e) {
      console.error("[forge/discovery]", e);
    }
  }

  // Rule-based fallback
  const questions = fallbackQuestions(
    classification.archetype,
    classification.domain,
    prompt,
    answeredIds,
    batchIndex
  );
  const complete = questions.length === 0 || shouldComplete(prior, batchIndex + 1);

  return {
    batchIndex,
    questions: complete ? [] : questions,
    progress: complete ? 100 : computeProgress(prior, batchIndex, false),
    complete,
    rationale: `Focused questions for a ${classification.label.toLowerCase()} (${classification.domain}).`,
    archetype: classification.archetype,
    domain: classification.domain,
    understanding: buildUnderstanding(
      prompt,
      classification.archetype,
      classification.domain,
      prior
    ),
    designedBy: secrets ? "fallback-after-llm" : "fallback",
  };
}

export function applySmartDefault(input: {
  question: InterviewQuestion;
  prompt: string;
  archetype: ProductArchetype;
}): { answer: string; assumption: string } {
  const answer = smartDefaultFor(input.question, input.archetype, input.prompt);
  return {
    answer,
    assumption: `${input.question.label} → assumed “${answer}”`,
  };
}

export { smartDefaultFor };
