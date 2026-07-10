/**
 * App Studio AI generation — research workflows then emit/patch a Vite React app.
 * Uses request-scoped keys or server env (Groq / Anthropic / XAI / Gemini / OpenAI).
 * Keys never written to git; prefer GEMINI_API_KEY when XAI fails (no credits).
 */

import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import type { AppLlmSecrets } from "@/lib/app-builder/types";
import { createBaseScaffold } from "@/lib/app-studio/scaffold";
import { mergeFiles, parseStudioFiles } from "@/lib/app-studio/parse-files";
import type {
  StudioFileMap,
  StudioGenerateResult,
  StudioResearchPack,
} from "@/lib/app-studio/types";

export class StudioLlmError extends Error {
  code: "no_key" | "credits" | "auth" | "upstream" | "parse";
  constructor(code: StudioLlmError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "StudioLlmError";
  }
}

function friendlyLlmError(err: unknown): StudioLlmError {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (
    lower.includes("permission-denied") ||
    lower.includes("credits") ||
    lower.includes("licenses") ||
    lower.includes("billing") ||
    lower.includes("quota") ||
    lower.includes("insufficient")
  ) {
    return new StudioLlmError(
      "credits",
      "AI provider has no credits/license (often xAI 403). We will try Gemini/Groq next if configured. Or paste a key in App Studio → AI key."
    );
  }
  if (lower.includes("401") || lower.includes("invalid api") || lower.includes("unauthorized") || lower.includes("api key not valid")) {
    return new StudioLlmError(
      "auth",
      "API key rejected. Check AI key settings or GEMINI_API_KEY / GROQ_API_KEY / XAI_API_KEY on the server."
    );
  }
  return new StudioLlmError("upstream", msg.slice(0, 280));
}

/** Ordered list of server-side keys to try when the client did not pass one. */
function listEnvSecrets(): AppLlmSecrets[] {
  const list: AppLlmSecrets[] = [];

  // Prefer Groq first (free, reliable for App Studio)
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    list.push({
      provider: "groq",
      apiKey: groq,
      model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    });
  }

  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) {
    list.push({
      provider: "custom",
      apiKey: anthropic,
      model: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514",
      baseUrl: process.env.ANTHROPIC_BASE_URL?.trim() || "https://api.anthropic.com/v1",
    });
  }

  const xai = process.env.XAI_API_KEY?.trim();
  if (xai) {
    list.push({
      provider: "xai",
      apiKey: xai,
      model: process.env.XAI_MODEL?.trim() || "grok-3-mini",
    });
  }

  // Prefer Gemini right after xAI so credit-less xAI teams fall through cleanly
  const gemini = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (gemini) {
    list.push({
      provider: "custom",
      apiKey: gemini,
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
      // Marker for callAnyLlm → native Gemini generateContent
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    });
  }

  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    list.push({
      provider: "custom",
      apiKey: openai,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
    });
  }

  return list;
}

function resolveStudioSecrets(override?: AppLlmSecrets | null): AppLlmSecrets[] {
  if (override?.apiKey?.trim()) {
    return [override];
  }
  return listEnvSecrets();
}

function isGeminiSecrets(secrets: AppLlmSecrets): boolean {
  const base = (secrets.baseUrl || "").toLowerCase();
  return (
    base.includes("generativelanguage.googleapis.com") ||
    base.includes("gemini") ||
    (secrets.model || "").toLowerCase().includes("gemini")
  );
}

async function callAnyLlm(
  secrets: AppLlmSecrets,
  input: {
    system: string;
    user: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  if (secrets.provider === "custom" && secrets.baseUrl?.includes("anthropic.com")) {
    return generateWithAnthropic(secrets, input.system, input.user, input.maxTokens ?? 8000);
  }
  if (secrets.provider === "custom" && isGeminiSecrets(secrets)) {
    return generateWithGemini(secrets, input.system, input.user, input.maxTokens ?? 8000);
  }
  return callUserLlm({
    secrets,
    temperature: input.temperature ?? 0.35,
    maxTokens: input.maxTokens ?? 8000,
    timeoutMs: 120_000,
    messages: [
      { role: "system", content: input.system },
      ...(input.history || []).slice(-6),
      { role: "user", content: input.user },
    ],
  });
}

/** Try each secret until one works; surface credit/auth errors clearly. */
async function callWithFallback(
  secretsList: AppLlmSecrets[],
  input: {
    system: string;
    user: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<{ text: string; used: AppLlmSecrets }> {
  if (!secretsList.length) {
    throw new StudioLlmError(
      "no_key",
      "No AI key configured. Paste a Gemini/Groq key in App Studio → AI key, or set GEMINI_API_KEY / GROQ_API_KEY on the server."
    );
  }

  const errors: string[] = [];
  for (const secrets of secretsList) {
    let lastForProvider: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const text = await callAnyLlm(secrets, input);
        return { text, used: secrets };
      } catch (e) {
        lastForProvider = e;
        const msg = e instanceof Error ? e.message : String(e);
        if (/\b429\b|rate limit|tokens per minute|tpm/i.test(msg) && attempt < 2) {
          const waitMs = 8_000 * (attempt + 1);
          console.warn(
            `[app-studio] ${secrets.provider} rate limited, retry in ${waitMs}ms (attempt ${attempt + 1})`
          );
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        break;
      }
    }
    const fe = friendlyLlmError(lastForProvider);
    console.warn(`[app-studio] provider ${secrets.provider} failed:`, fe.message);
    errors.push(`${secrets.provider}: ${fe.message}`);
  }

  const joined = errors.join(" | ");
  if (joined.toLowerCase().includes("credit") || joined.toLowerCase().includes("license")) {
    throw new StudioLlmError("credits", errors[errors.length - 1] || joined);
  }
  throw new StudioLlmError("upstream", errors[errors.length - 1] || joined);
}

const RESEARCH_SYSTEM = `You are a senior product researcher for an AI app builder that ships WORKING multi-role apps (not marketing sites).

After research, another step will expand your pack into a full build spec. So be thorough.

Return ONLY JSON:
{
  "summary": "2-4 sentence product summary including region and primary job-to-be-done",
  "targetUsers": string[],
  "coreWorkflows": [{ "name": string, "steps": string[] }],
  "screens": string[],
  "dataEntities": string[],
  "techNotes": string[],
  "competitors": [{ "name": string, "takeaway": string }]
}

Rules:
- coreWorkflows: include BOTH happy-path and failure-path notes in step names where relevant (e.g. "Enter amount — reject if over balance").
- screens: for digital banking list 15–20 modules (Home, Accounts, Send money, UPI, Payees, Bills, Cards, Transactions, Statements, Insights, Deposits, Loans, Scheduled, Limits, KYC, Security, Alerts, Disputes, Support, Ops queue).
- For resume products: Builder, Live preview, Tips, LinkedIn checklist, Review queue, Export.
- competitors: real names when known (Jupiter, Fi, CRED, PhonePe for India banking; LinkedIn/Naukri for career).
- Class-8 clear English. Concrete steps only.`;

export async function researchStudioIdea(input: {
  prompt: string;
  secrets?: AppLlmSecrets | null;
}): Promise<StudioResearchPack> {
  const fallback: StudioResearchPack = heuristicResearch(input.prompt);
  const list = resolveStudioSecrets(input.secrets);
  if (!list.length) return fallback;

  try {
    const { text } = await callWithFallback(list, {
      system: RESEARCH_SYSTEM,
      user: input.prompt,
      maxTokens: 2500,
      temperature: 0.35,
    });
    const parsed = parseJsonObject<Partial<StudioResearchPack>>(text);
    return {
      summary: parsed.summary || fallback.summary,
      targetUsers: Array.isArray(parsed.targetUsers) ? parsed.targetUsers : fallback.targetUsers,
      coreWorkflows: Array.isArray(parsed.coreWorkflows)
        ? parsed.coreWorkflows
        : fallback.coreWorkflows,
      screens: Array.isArray(parsed.screens) ? parsed.screens : fallback.screens,
      dataEntities: Array.isArray(parsed.dataEntities)
        ? parsed.dataEntities
        : fallback.dataEntities,
      techNotes: Array.isArray(parsed.techNotes) ? parsed.techNotes : fallback.techNotes,
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
    };
  } catch (e) {
    console.error("[app-studio/research]", e);
    return fallback;
  }
}

function heuristicResearch(prompt: string): StudioResearchPack {
  const p = prompt.toLowerCase();
  if (/\byoga|studio|class|booking|appointment\b/.test(p)) {
    return {
      summary:
        "A yoga studio booking app: members browse classes, book spots, and manage membership vs drop-in.",
      targetUsers: ["Studio members", "Drop-in guests", "Studio owner / front desk"],
      coreWorkflows: [
        {
          name: "Book a class",
          steps: [
            "Browse schedule",
            "Pick class",
            "Choose membership or drop-in",
            "Confirm booking",
            "Get confirmation",
          ],
        },
        {
          name: "Owner manages schedule",
          steps: ["Add class", "Set capacity", "Assign instructor", "See roster"],
        },
      ],
      screens: ["Home", "Schedule", "Class detail", "My bookings", "Membership", "Owner admin"],
      dataEntities: ["Class", "Booking", "Member", "Instructor", "MembershipPlan"],
      techNotes: ["React SPA", "Local mock state", "Tailwind UI"],
      competitors: [
        { name: "Mindbody", takeaway: "Heavy for small studios — keep booking simple" },
        { name: "Momence", takeaway: "Clean class schedule + packs" },
      ],
    };
  }
  return {
    summary: prompt.slice(0, 240),
    targetUsers: ["Primary users of this product"],
    coreWorkflows: [
      {
        name: "Happy path",
        steps: ["Land", "Sign up or start", "Complete main job", "See result"],
      },
    ],
    screens: ["Home", "Main workspace", "Settings"],
    dataEntities: ["User", "Item"],
    techNotes: ["React + Vite + Tailwind CDN for preview"],
    competitors: [],
  };
}

const GEN_SYSTEM = `You generate a React + TypeScript SPA for Sandpack preview.

CRITICAL OUTPUT FORMAT — return ONLY valid JSON (no markdown fences, no commentary):
{"summary":"one sentence","files":{"/src/App.tsx":"...full file...","/src/styles.css":"...","/src/main.tsx":"...","/index.html":"...","/package.json":"..."}}

Rules:
- files values MUST be complete source strings (escape newlines as \\n inside JSON strings properly, or use real newlines if the whole response is pure JSON).
- Always include at least /src/App.tsx with a default export App component.
- Prefer a single polished /src/App.tsx (import React) + /src/styles.css rather than many files.
- Use Tailwind utility classes in className (CDN is loaded by the preview host).
- Working UI with useState — match the product idea and research workflows.
- No API keys, no fetch to external backends. Mock data only.
- Keep total response under ~6000 tokens so JSON is not truncated.`;

const GEN_SYSTEM_XML = `You generate React code for a Sandpack preview.
Output ONLY XML file tags, no JSON, no markdown:
<file path="/src/App.tsx">
...full source...
</file>
<file path="/src/styles.css">
...css...
</file>
Always include /src/App.tsx with export default function App.
Use Tailwind className utilities. Mock data only. One solid interactive screen is enough.`;

export async function generateStudioApp(input: {
  prompt: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  currentFiles?: StudioFileMap | null;
  research?: StudioResearchPack | null;
  imageDescription?: string | null;
  secrets?: AppLlmSecrets | null;
  /** When true, throw instead of silent template on LLM failure */
  strict?: boolean;
}): Promise<StudioGenerateResult & { errorCode?: string }> {
  const secretsList = resolveStudioSecrets(input.secrets);
  const base = input.currentFiles?.["/src/App.tsx"]
    ? input.currentFiles
    : createBaseScaffold();

  if (!secretsList.length) {
    if (input.strict) {
      throw new StudioLlmError(
        "no_key",
        "No AI key configured. Open AI key settings and paste a Groq or Anthropic key (xAI team has no credits)."
      );
    }
    return {
      files: offlineAppFromPrompt(input.prompt, base),
      summary:
        "Template only — no AI key. Paste a key under AI key (recommended: free Groq key), or add GROQ_API_KEY on the server.",
      research: input.research || null,
      designedBy: "scaffold",
      errorCode: "no_key",
    };
  }

  const isUpdate = Boolean(
    input.currentFiles && Object.keys(input.currentFiles).length > 3
  );

  const fileSnapshot = isUpdate
    ? Object.entries(input.currentFiles || {})
        .slice(0, 20)
        .map(([p, c]) => `=== ${p} ===\n${c.slice(0, 4000)}`)
        .join("\n\n")
    : "(new project — generate full scaffold)";

  const userPayload = {
    task: isUpdate
      ? "Apply the user request as precise file updates (return only changed files as full contents)."
      : "Generate a complete Vite React app for this product idea.",
    prompt: input.prompt,
    research: input.research,
    imageDescription: input.imageDescription || null,
    previousFiles: fileSnapshot,
  };

  try {
    const compactUser = JSON.stringify({
      task: userPayload.task,
      prompt: input.prompt.slice(0, 800),
      researchSummary: input.research?.summary?.slice(0, 400),
      workflows: input.research?.coreWorkflows?.slice(0, 2),
      screens: input.research?.screens?.slice(0, 6),
      isUpdate,
      // Don't dump huge previous trees — Groq truncates JSON
      previousAppSnippet: isUpdate
        ? (input.currentFiles?.["/src/App.tsx"] || "").slice(0, 2500)
        : null,
    });

    const { text: raw, used } = await callWithFallback(secretsList, {
      system: GEN_SYSTEM,
      user: compactUser,
      history: input.history?.slice(-4),
      maxTokens: 6000,
      temperature: 0.3,
    });

    let files = parseStudioFiles(raw);
    let summary = "Updated application";
    try {
      const obj = parseJsonObject<{ summary?: string }>(raw);
      if (obj.summary) summary = obj.summary;
    } catch {
      /* keep */
    }

    // Retry once with simpler XML format if JSON parse failed
    if (!Object.keys(files).length) {
      console.warn("[app-studio] JSON parse empty, retrying XML format…");
      try {
        const retry = await callWithFallback(secretsList, {
          system: GEN_SYSTEM_XML,
          user: `Product: ${input.prompt.slice(0, 600)}\nResearch: ${input.research?.summary?.slice(0, 300) || "n/a"}\nBuild a complete interactive UI in /src/App.tsx`,
          maxTokens: 5000,
          temperature: 0.25,
        });
        files = parseStudioFiles(retry.text);
        if (Object.keys(files).length) {
          summary = "Generated app (XML format retry)";
        }
      } catch (retryErr) {
        console.warn("[app-studio] XML retry failed", retryErr);
      }
    }

    if (!Object.keys(files).length) {
      // Soft success: domain template so UI still works (research already succeeded)
      const offline = offlineAppFromPrompt(input.prompt, base);
      return {
        files: offline,
        summary:
          "AI response was truncated or unparseable. Loaded a working starter matching your idea — try Build again or shorten the prompt for a full custom gen.",
        research: input.research || null,
        designedBy: `${used.provider}-parse-fallback`,
        errorCode: undefined, // do not hard-fail the UI
      };
    }

    const normalized: StudioFileMap = {};
    for (const [k, v] of Object.entries(files)) {
      const path = k.startsWith("/") ? k : `/${k}`;
      normalized[path] = v;
    }

    const merged = isUpdate
      ? mergeFiles(base, normalized)
      : mergeFiles(createBaseScaffold(), normalized);

    // Ensure Sandpack-critical entry files
    const scaffold = createBaseScaffold();
    if (!merged["/src/App.tsx"] && !merged["/App.tsx"]) {
      merged["/src/App.tsx"] = scaffold["/src/App.tsx"];
    }
    if (!merged["/src/main.tsx"]) merged["/src/main.tsx"] = scaffold["/src/main.tsx"];
    if (!merged["/index.html"]) merged["/index.html"] = scaffold["/index.html"];
    if (!merged["/package.json"]) merged["/package.json"] = scaffold["/package.json"];
    if (!merged["/src/styles.css"]) merged["/src/styles.css"] = scaffold["/src/styles.css"];

    return {
      files: merged,
      summary,
      research: input.research || null,
      designedBy: isGeminiSecrets(used)
        ? `gemini:${used.model || "gemini-2.0-flash"}`
        : used.provider === "custom"
          ? used.model || "custom"
          : used.provider,
    };
  } catch (e) {
    console.error("[app-studio/generate]", e);
    const fe = e instanceof StudioLlmError ? e : friendlyLlmError(e);
    // Always return a usable app so Sandpack can render
    return {
      files: offlineAppFromPrompt(input.prompt, base),
      summary: `${fe.message} Showing a working starter template — fix the AI key or retry.`,
      research: input.research || null,
      designedBy: "error-fallback",
      errorCode: fe.code === "parse" ? undefined : fe.code,
    };
  }
}

async function generateWithAnthropic(
  secrets: AppLlmSecrets,
  system: string,
  user: string,
  maxTokens = 8000
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": secrets.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: secrets.model || "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  return data.content?.find((c) => c.type === "text")?.text || "";
}

/** Google Gemini generateContent (AI Studio / Generative Language API). */
async function generateWithGemini(
  secrets: AppLlmSecrets,
  system: string,
  user: string,
  maxTokens = 8000
): Promise<string> {
  const key = secrets.apiKey.trim();
  const preferred = (secrets.model || "gemini-2.0-flash").replace(/^models\//, "");
  const models = [
    preferred,
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.5-flash",
  ].filter((m, i, a) => a.indexOf(m) === i);

  let lastErr = "Gemini failed";
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: maxTokens,
            },
          }),
          signal: AbortSignal.timeout(120_000),
        });

        if (res.status === 429) {
          lastErr = `Gemini ${model}: rate limited (429)`;
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
          continue;
        }
        if (res.status === 404) {
          lastErr = `Gemini model not found: ${model}`;
          break; // try next model
        }
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          lastErr = `Gemini ${res.status}: ${t.slice(0, 240)}`;
          // 403/401 — don't thrash models
          if (res.status === 401 || res.status === 403) throw new Error(lastErr);
          break;
        }

        const data = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
          error?: { message?: string };
        };
        if (data.error?.message) throw new Error(`Gemini: ${data.error.message}`);
        const text = data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || "")
          .join("")
          .trim();
        if (!text) throw new Error("Gemini returned an empty response");
        return text;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        if (lastErr.includes("401") || lastErr.includes("403")) throw e;
      }
    }
  }
  throw new Error(lastErr);
}

function offlineAppFromPrompt(prompt: string, base: StudioFileMap): StudioFileMap {
  const isYoga = /\byoga|studio|class|booking\b/i.test(prompt);
  const title =
    prompt.match(/(?:called|named)\s+["']?([A-Za-z0-9 &-]{2,40})/i)?.[1] ||
    (isYoga ? "ZenFlow Studio" : "Studio App");

  if (isYoga) {
    return yogaBookingApp(title, prompt, base);
  }

  const app = `import React from "react";

export default function App() {
  const [tab, setTab] = React.useState("home");
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-lg">${title.replace(/"/g, "")}</div>
          <nav className="flex gap-2 text-sm">
            {["home", "app", "about"].map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={\`px-3 py-1.5 rounded-lg capitalize \${tab === t ? "bg-teal-600 text-white" : "hover:bg-slate-100"}\`}>
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10">
        {tab === "home" && (
          <section className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">${title.replace(/"/g, "")}</h1>
            <p className="text-lg text-slate-600 max-w-2xl">${prompt.slice(0, 280).replace(/`/g, "'").replace(/"/g, "'")}</p>
            <button type="button" onClick={() => setTab("app")}
              className="inline-flex items-center rounded-xl bg-teal-600 px-5 py-3 text-white font-semibold shadow hover:bg-teal-700">
              Open workspace
            </button>
          </section>
        )}
        {tab === "app" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Main workspace</h2>
            <p className="text-slate-600 mt-2">Starter UI — connect a working AI key for a full custom build.</p>
          </section>
        )}
        {tab === "about" && <p className="text-slate-600">Generated by Verlin Labs App Studio.</p>}
      </main>
    </div>
  );
}
`;

  return {
    ...base,
    "/src/App.tsx": app,
    "/index.html": createBaseScaffold(title)["/index.html"],
  };
}

function yogaBookingApp(title: string, prompt: string, base: StudioFileMap): StudioFileMap {
  const safeTitle = title.replace(/"/g, "");
  const app = `import React from "react";

const CLASSES = [
  { id: "c1", name: "Sunrise Vinyasa", time: "Today · 7:00 AM", instructor: "Asha", spots: 4, level: "All levels" },
  { id: "c2", name: "Power Flow", time: "Today · 6:30 PM", instructor: "Rohan", spots: 2, level: "Intermediate" },
  { id: "c3", name: "Yin & Restore", time: "Tomorrow · 8:00 AM", instructor: "Meera", spots: 8, level: "Beginner" },
  { id: "c4", name: "Prenatal Yoga", time: "Sat · 10:00 AM", instructor: "Asha", spots: 5, level: "All levels" },
];

export default function App() {
  const [tab, setTab] = React.useState("schedule");
  const [bookings, setBookings] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [name, setName] = React.useState("");
  const [plan, setPlan] = React.useState("dropin");
  const [toast, setToast] = React.useState(null);

  function book() {
    if (!selected || !name.trim()) {
      setToast("Enter your name to book");
      return;
    }
    setBookings((b) => [
      { id: Date.now(), classId: selected.id, className: selected.name, time: selected.time, name, plan },
      ...b,
    ]);
    setToast(\`Booked \${selected.name} for \${name}\`);
    setSelected(null);
    setName("");
    setTab("mine");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-lg font-bold text-emerald-900">${safeTitle}</p>
            <p className="text-xs text-emerald-700/80">Book classes · memberships · drop-ins</p>
          </div>
          <nav className="flex gap-1 text-sm">
            {[
              ["schedule", "Schedule"],
              ["mine", "My bookings"],
              ["membership", "Plans"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={\`rounded-full px-3 py-1.5 \${tab === id ? "bg-emerald-700 text-white" : "text-emerald-900 hover:bg-emerald-50"}\`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        {toast && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 flex justify-between">
            <span>{toast}</span>
            <button type="button" onClick={() => setToast(null)}>×</button>
          </div>
        )}

        {tab === "schedule" && (
          <>
            <section className="rounded-2xl bg-emerald-900 text-white p-5 shadow-lg">
              <h1 className="text-2xl font-bold">Find your class</h1>
              <p className="mt-1 text-emerald-100 text-sm">${prompt.slice(0, 160).replace(/`/g, "'").replace(/"/g, "'")}</p>
            </section>
            <div className="space-y-3">
              {CLASSES.map((c) => (
                <article key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-lg">{c.name}</h2>
                    <p className="text-sm text-slate-600">{c.time} · {c.instructor} · {c.level}</p>
                    <p className="text-xs text-emerald-700 mt-1">{c.spots} spots left</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelected(c); setTab("book"); }}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    Book
                  </button>
                </article>
              ))}
            </div>
          </>
        )}

        {tab === "book" && selected && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-xl font-bold">Book {selected.name}</h2>
            <p className="text-sm text-slate-600">{selected.time} with {selected.instructor}</p>
            <label className="block text-sm">
              Your name
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="e.g. Priya" />
            </label>
            <label className="block text-sm">
              Payment
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
                <option value="dropin">Drop-in · ₹500</option>
                <option value="member">Membership class · included</option>
                <option value="pack">Class pack · 1 credit</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={book} className="rounded-xl bg-emerald-700 px-4 py-2 text-white font-semibold">Confirm</button>
              <button type="button" onClick={() => setTab("schedule")} className="rounded-xl border border-slate-300 px-4 py-2">Back</button>
            </div>
          </section>
        )}

        {tab === "mine" && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold">My bookings</h2>
            {bookings.length === 0 && <p className="text-slate-600 text-sm">No bookings yet. Pick a class from Schedule.</p>}
            {bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="font-semibold">{b.className}</p>
                <p className="text-sm text-slate-600">{b.time} · {b.name} · {b.plan}</p>
              </div>
            ))}
          </section>
        )}

        {tab === "membership" && (
          <section className="grid sm:grid-cols-2 gap-3">
            {[
              { name: "Drop-in", price: "₹500", desc: "Single class, no commitment" },
              { name: "10-class pack", price: "₹4,200", desc: "Save on regular practice" },
              { name: "Monthly unlimited", price: "₹3,999", desc: "Best for 3+ classes / week" },
              { name: "Private session", price: "₹2,500", desc: "1:1 with instructor" },
            ].map((p) => (
              <div key={p.name} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <p className="font-semibold">{p.name}</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{p.price}</p>
                <p className="text-sm text-slate-600 mt-1">{p.desc}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
`;

  return {
    ...base,
    "/src/App.tsx": app,
    "/index.html": createBaseScaffold(safeTitle)["/index.html"],
  };
}

export { resolveStudioSecrets, listEnvSecrets };
