import type { AppLlmSecrets, LlmProviderKind } from "@/lib/app-builder/types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function resolveEndpoint(secrets: AppLlmSecrets): { url: string; headers: Record<string, string> } {
  const key = secrets.apiKey.trim();
  if (!key) throw new Error("API key is required");

  if (secrets.provider === "xai") {
    return {
      url: "https://api.x.ai/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    };
  }

  if (secrets.provider === "groq") {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    };
  }

  // Custom OpenAI-compatible
  const base = (secrets.baseUrl || "").replace(/\/$/, "");
  if (!base) throw new Error("Custom provider requires a base URL (OpenAI-compatible)");
  return {
    url: `${base}/chat/completions`,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  };
}

export function defaultModelForProvider(provider: LlmProviderKind): string {
  if (provider === "xai") return "grok-3-mini";
  if (provider === "groq") return "llama-3.3-70b-versatile";
  return "gpt-4o-mini";
}

/**
 * Call user's LLM (Grok / Groq / custom OpenAI-compatible).
 * API keys are request-scoped only — never written to disk/Blob.
 */
export async function callUserLlm(input: {
  secrets: AppLlmSecrets;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const model = input.secrets.model.trim() || defaultModelForProvider(input.secrets.provider);
  const { url, headers } = resolveEndpoint({ ...input.secrets, model });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: input.messages,
      temperature: input.temperature ?? 0.45,
      max_tokens: input.maxTokens ?? 4000,
    }),
    signal: AbortSignal.timeout(input.timeoutMs ?? 90_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM API ${res.status}: ${body.slice(0, 280)}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("LLM returned an empty response");
  return content;
}

export function parseJsonObject<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced?.[1] ?? raw).trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("LLM response was not valid JSON");
  return JSON.parse(text.slice(start, end + 1)) as T;
}
