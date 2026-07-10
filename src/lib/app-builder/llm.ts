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

  // Custom OpenAI-compatible — block SSRF to private/metadata hosts
  const base = (secrets.baseUrl || "").replace(/\/$/, "");
  if (!base) throw new Error("Custom provider requires a base URL (OpenAI-compatible)");
  assertSafeLlmBaseUrl(base);
  return {
    url: `${base}/chat/completions`,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  };
}

/** Reject custom LLM endpoints that target private / cloud-metadata networks */
export function assertSafeLlmBaseUrl(baseUrl: string): void {
  let u: URL;
  try {
    u = new URL(baseUrl);
  } catch {
    throw new Error("Custom AI URL is invalid");
  }
  if (u.protocol !== "https:") {
    throw new Error("Custom AI URL must use https://");
  }
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === "metadata" ||
    host.startsWith("100.64.")
  ) {
    throw new Error("Custom AI URL cannot target private or metadata hosts");
  }
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
  let slice = text.slice(start, end + 1);
  // Common LLM JSON defects
  slice = slice
    .replace(/,\s*([}\]])/g, "$1") // trailing commas
    .replace(/[\u201c\u201d]/g, '"') // smart quotes
    .replace(/[\u2018\u2019]/g, "'");
  try {
    return JSON.parse(slice) as T;
  } catch {
    // Strip control chars except newline/tab
    const cleaned = slice.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    return JSON.parse(cleaned) as T;
  }
}
