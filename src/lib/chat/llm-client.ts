/**
 * Free-first LLM client for the public chatbot (OpenAI-compatible providers).
 *
 * Priority (first match wins):
 * 1. Groq  — free tier, very fast, Llama 3.3 70B (best free for live chat on Vercel)
 * 2. Google Gemini — free AI Studio key, Flash models
 * 3. Z.ai GLM — paid, only if ZAI_API_KEY is set
 */

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type LlmProvider = "groq" | "gemini" | "zai";

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Human label for UI */
  label: string;
  /** Extra JSON fields for the chat/completions body */
  extraBody?: Record<string, unknown>;
}

export function getLlmConfig(): LlmConfig | null {
  // Explicit override (optional)
  const forced = process.env.CHAT_LLM_PROVIDER?.trim().toLowerCase();

  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim();
  const zaiKey =
    process.env.ZAI_API_KEY?.trim() ||
    process.env.GLM_API_KEY?.trim() ||
    process.env.ZHIPU_API_KEY?.trim();

  const groq: LlmConfig | null = groqKey
    ? {
        provider: "groq",
        apiKey: groqKey,
        baseUrl: (process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1").replace(
          /\/$/,
          ""
        ),
        // Strong free chat model on Groq's free tier
        model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
        label: "Llama 3.3 70B (Groq free)",
      }
    : null;

  const gemini: LlmConfig | null = geminiKey
    ? {
        provider: "gemini",
        apiKey: geminiKey,
        baseUrl: (
          process.env.GEMINI_BASE_URL?.trim() ||
          "https://generativelanguage.googleapis.com/v1beta/openai"
        ).replace(/\/$/, ""),
        model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
        label: "Gemini Flash (Google free)",
      }
    : null;

  const zai: LlmConfig | null = zaiKey
    ? {
        provider: "zai",
        apiKey: zaiKey,
        baseUrl: (
          process.env.GLM_BASE_URL?.trim() ||
          process.env.ZAI_BASE_URL?.trim() ||
          "https://api.z.ai/api/paas/v4"
        ).replace(/\/$/, ""),
        model: process.env.GLM_MODEL?.trim() || process.env.ZAI_MODEL?.trim() || "glm-5.2",
        label: "GLM-5.2 (Z.ai)",
        extraBody: { thinking: { type: "disabled" } },
      }
    : null;

  if (forced === "groq" && groq) return groq;
  if (forced === "gemini" && gemini) return gemini;
  if ((forced === "zai" || forced === "glm") && zai) return zai;

  // Free-first default order for Verlin Labs production
  return groq ?? gemini ?? zai;
}

export function isLlmConfigured(): boolean {
  return getLlmConfig() !== null;
}

export function getLlmPublicInfo(): { enabled: boolean; provider: string | null; model: string | null; label: string | null } {
  const config = getLlmConfig();
  if (!config) {
    return { enabled: false, provider: null, model: null, label: null };
  }
  return {
    enabled: true,
    provider: config.provider,
    model: config.model,
    label: config.label,
  };
}

export async function createChatCompletion(input: {
  messages: ChatCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<{ content: string; provider: LlmProvider; model: string; label: string }> {
  const config = getLlmConfig();
  if (!config) {
    throw new Error("No free LLM configured. Set GROQ_API_KEY (recommended) or GEMINI_API_KEY.");
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.4,
      max_tokens: input.maxTokens ?? 1024,
      ...config.extraBody,
    }),
    signal: AbortSignal.timeout(input.timeoutMs ?? 25_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${config.provider} API ${res.status}: ${body.slice(0, 240)}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`${config.provider} returned an empty response`);
  }

  return {
    content,
    provider: config.provider,
    model: config.model,
    label: config.label,
  };
}

/** @deprecated Use isLlmConfigured — kept for older imports */
export function isGlmConfigured(): boolean {
  return isLlmConfigured();
}
