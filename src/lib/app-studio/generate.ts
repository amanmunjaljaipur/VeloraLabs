/**
 * App Studio AI generation — research workflows then emit/patch a Vite React app.
 * Uses platform Grok (XAI_API_KEY) or optional ANTHROPIC / request key. Keys never persisted.
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

function resolveStudioSecrets(override?: AppLlmSecrets | null): AppLlmSecrets | null {
  if (override?.apiKey?.trim()) return override;

  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) {
    return {
      provider: "custom",
      apiKey: anthropic,
      model: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514",
      baseUrl: process.env.ANTHROPIC_BASE_URL?.trim() || "https://api.anthropic.com/v1",
    };
  }

  const xai = process.env.XAI_API_KEY?.trim();
  if (xai) {
    return {
      provider: "xai",
      apiKey: xai,
      model: process.env.XAI_MODEL?.trim() || "grok-3-mini",
    };
  }

  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      provider: "groq",
      apiKey: groq,
      model: "llama-3.3-70b-versatile",
    };
  }

  return null;
}

export async function researchStudioIdea(input: {
  prompt: string;
  secrets?: AppLlmSecrets | null;
}): Promise<StudioResearchPack> {
  const secrets = resolveStudioSecrets(input.secrets);
  const fallback: StudioResearchPack = {
    summary: input.prompt.slice(0, 240),
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

  if (!secrets) return fallback;

  try {
    // Anthropic Messages API is not OpenAI-compatible path — use xAI/Groq OpenAI style primarily
    if (secrets.provider === "custom" && secrets.baseUrl?.includes("anthropic.com")) {
      return await researchWithAnthropic(input.prompt, secrets);
    }

    const raw = await callUserLlm({
      secrets,
      temperature: 0.35,
      maxTokens: 2500,
      timeoutMs: 60_000,
      messages: [
        {
          role: "system",
          content: `You are a product researcher for an AI app builder (like Lovable).
Given a product idea, return ONLY JSON:
{
  "summary": "one paragraph product summary",
  "targetUsers": string[],
  "coreWorkflows": [{ "name": string, "steps": string[] }],
  "screens": string[],
  "dataEntities": string[],
  "techNotes": string[],
  "competitors": [{ "name": string, "takeaway": string }]
}
Use real competitor names when you know them; otherwise empty array. Class-8 English. Keep workflows concrete (3-6 steps).`,
        },
        {
          role: "user",
          content: input.prompt,
        },
      ],
    });
    const parsed = parseJsonObject<Partial<StudioResearchPack>>(raw);
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

async function researchWithAnthropic(
  prompt: string,
  secrets: AppLlmSecrets
): Promise<StudioResearchPack> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": secrets.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: secrets.model || "claude-sonnet-4-20250514",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: `Research this product idea for an AI app builder. Return ONLY JSON with keys summary, targetUsers, coreWorkflows[{name,steps}], screens, dataEntities, techNotes, competitors[{name,takeaway}].\n\nIdea: ${prompt}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text || "";
  return parseJsonObject<StudioResearchPack>(text);
}

const GEN_SYSTEM = `You are an elite full-stack engineer generating a Vite + React + TypeScript SPA that runs in Sandpack / browser.

Rules:
1. Output ONLY JSON: { "summary": "what you built", "files": { "/path": "full file content" } }
2. Always include these paths when generating a full app:
   /package.json, /index.html, /vite.config.ts, /src/main.tsx, /src/App.tsx, /src/styles.css
   and any extra components under /src/
3. Use Tailwind via CDN in index.html: <script src="https://cdn.tailwindcss.com"></script>
4. package.json must list react, react-dom, lucide-react, clsx; vite + @vitejs/plugin-react as devDeps.
5. For UPDATES (when previous files are provided): only return files you changed (full content of each changed file). Unchanged files can be omitted.
6. Build complete, beautiful, working UI matching the research workflows and screens — not placeholders.
7. No external API keys in generated code. Mock data is fine.
8. Single-page app is OK; use React useState for multi-screen navigation if needed.
9. Accessible, modern, clean design. Mobile-friendly.
10. File paths must start with /.`;

export async function generateStudioApp(input: {
  prompt: string;
  /** Conversation history for iteration */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  currentFiles?: StudioFileMap | null;
  research?: StudioResearchPack | null;
  imageDescription?: string | null;
  secrets?: AppLlmSecrets | null;
}): Promise<StudioGenerateResult> {
  const secrets = resolveStudioSecrets(input.secrets);
  const base = input.currentFiles?.["/src/App.tsx"]
    ? input.currentFiles
    : createBaseScaffold();

  if (!secrets) {
    // Offline template fallback tailored lightly to prompt
    const offline = offlineAppFromPrompt(input.prompt, base);
    return {
      files: offline,
      summary: "Template scaffold (no LLM key configured). Set XAI_API_KEY or ANTHROPIC_API_KEY.",
      research: input.research || null,
      designedBy: "scaffold",
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
    let raw: string;
    if (secrets.provider === "custom" && secrets.baseUrl?.includes("anthropic.com")) {
      raw = await generateWithAnthropic(secrets, GEN_SYSTEM, JSON.stringify(userPayload));
    } else {
      raw = await callUserLlm({
        secrets,
        temperature: 0.35,
        maxTokens: 8000,
        timeoutMs: 120_000,
        messages: [
          { role: "system", content: GEN_SYSTEM },
          ...(input.history || []).slice(-6).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user", content: JSON.stringify(userPayload) },
        ],
      });
    }

    let files = parseStudioFiles(raw);
    if (!Object.keys(files).length) {
      // try parse as { files }
      try {
        const obj = parseJsonObject<{ files?: StudioFileMap; summary?: string }>(raw);
        if (obj.files) files = obj.files;
      } catch {
        /* empty */
      }
    }

    if (!Object.keys(files).length) {
      return {
        files: offlineAppFromPrompt(input.prompt, base),
        summary: "Could not parse model files — used template fallback.",
        research: input.research || null,
        designedBy: "parse-fallback",
      };
    }

    // Normalize paths
    const normalized: StudioFileMap = {};
    for (const [k, v] of Object.entries(files)) {
      const path = k.startsWith("/") ? k : `/${k}`;
      normalized[path] = v;
    }

    const merged = isUpdate ? mergeFiles(base, normalized) : mergeFiles(createBaseScaffold(), normalized);

    // Ensure entry points exist
    if (!merged["/src/main.tsx"]) {
      merged["/src/main.tsx"] = createBaseScaffold()["/src/main.tsx"];
    }
    if (!merged["/index.html"]) {
      merged["/index.html"] = createBaseScaffold()["/index.html"];
    }

    let summary = "Updated application";
    try {
      const obj = parseJsonObject<{ summary?: string }>(raw);
      if (obj.summary) summary = obj.summary;
    } catch {
      /* keep default */
    }

    return {
      files: merged,
      summary,
      research: input.research || null,
      designedBy: secrets.provider,
    };
  } catch (e) {
    console.error("[app-studio/generate]", e);
    return {
      files: offlineAppFromPrompt(input.prompt, base),
      summary: `Generation failed: ${e instanceof Error ? e.message.slice(0, 120) : "error"}. Showing template.`,
      research: input.research || null,
      designedBy: "error-fallback",
    };
  }
}

async function generateWithAnthropic(
  secrets: AppLlmSecrets,
  system: string,
  user: string
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
      max_tokens: 8000,
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

function offlineAppFromPrompt(prompt: string, base: StudioFileMap): StudioFileMap {
  const title =
    prompt.match(/(?:called|named)\s+["']?([A-Za-z0-9 &-]{2,40})/i)?.[1] ||
    "Studio App";
  const app = `export default function App() {
  const [tab, setTab] = React.useState("home");
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-lg">${title.replace(/"/g, "")}</div>
          <nav className="flex gap-2 text-sm">
            {["home", "app", "about"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={\`px-3 py-1.5 rounded-lg capitalize \${tab === t ? "bg-teal-600 text-white" : "hover:bg-slate-100"}\`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10">
        {tab === "home" && (
          <section className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">Build faster with ${title.replace(/"/g, "")}</h1>
            <p className="text-lg text-slate-600 max-w-2xl">${prompt.slice(0, 280).replace(/`/g, "'").replace(/"/g, "'")}</p>
            <button
              type="button"
              onClick={() => setTab("app")}
              className="inline-flex items-center rounded-xl bg-teal-600 px-5 py-3 text-white font-semibold shadow hover:bg-teal-700"
            >
              Open workspace
            </button>
          </section>
        )}
        {tab === "app" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold">Main workspace</h2>
            <p className="text-slate-600">Sample interactive board. Ask the AI to customize this fully.</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {["Todo", "In progress", "Done"].map((col) => (
                <div key={col} className="rounded-xl bg-slate-50 border border-slate-200 p-3 min-h-[140px]">
                  <div className="text-xs font-semibold uppercase text-slate-500 mb-2">{col}</div>
                  <div className="rounded-lg bg-white border border-slate-200 p-2 text-sm shadow-sm">Example card</div>
                </div>
              ))}
            </div>
          </section>
        )}
        {tab === "about" && (
          <section className="prose prose-slate">
            <h2>About</h2>
            <p>Generated by Verlin Labs App Studio as a starting template.</p>
          </section>
        )}
      </main>
    </div>
  );
}
`;

  // Need React in scope for offline template
  const withReact = `import React from "react";\n\n${app}`;

  return {
    ...base,
    "/src/App.tsx": withReact,
    "/index.html": createBaseScaffold(title)["/index.html"],
  };
}

export { resolveStudioSecrets };
