/**
 * Free-only LLM client for the public chatbot (OpenAI-compatible).
 *
 * Supported providers (first available key wins):
 * 1. Groq  — free tier, Llama 3.3 70B (recommended for Vercel)
 * 2. Google Gemini Flash — free AI Studio key
 *
 * Paid providers (Z.ai / GLM / OpenAI / Anthropic) are intentionally not used.
 */

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type LlmProvider = "groq" | "gemini";

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  label: string;
}

export function getLlmConfig(): LlmConfig | null {
  const forced = process.env.CHAT_LLM_PROVIDER?.trim().toLowerCase();

  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim();

  const groq: LlmConfig | null = groqKey
    ? {
        provider: "groq",
        apiKey: groqKey,
        baseUrl: (process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1").replace(
          /\/$/,
          ""
        ),
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

  if (forced === "groq" && groq) return groq;
  if (forced === "gemini" && gemini) return gemini;

  return groq ?? gemini;
}

export function isLlmConfigured(): boolean {
  return getLlmConfig() !== null;
}

export function getLlmPublicInfo(): {
  enabled: boolean;
  provider: string | null;
  model: string | null;
  label: string | null;
} {
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
      temperature: input.temperature ?? 0.35,
      max_tokens: input.maxTokens ?? 1024,
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
