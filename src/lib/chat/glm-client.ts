/**
 * Z.ai GLM OpenAI-compatible client for the public chatbot.
 * Docs: https://docs.z.ai — model id `glm-5.2`, base `https://api.z.ai/api/paas/v4/`
 */

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function getGlmConfig(): GlmConfig | null {
  const apiKey =
    process.env.ZAI_API_KEY?.trim() ||
    process.env.GLM_API_KEY?.trim() ||
    process.env.ZHIPU_API_KEY?.trim();
  if (!apiKey) return null;

  const baseUrl = (
    process.env.GLM_BASE_URL?.trim() ||
    process.env.ZAI_BASE_URL?.trim() ||
    "https://api.z.ai/api/paas/v4"
  ).replace(/\/$/, "");

  const model = process.env.GLM_MODEL?.trim() || process.env.ZAI_MODEL?.trim() || "glm-5.2";

  return { apiKey, baseUrl, model };
}

export function isGlmConfigured(): boolean {
  return getGlmConfig() !== null;
}

export async function createGlmChatCompletion(input: {
  messages: ChatCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const config = getGlmConfig();
  if (!config) {
    throw new Error("GLM is not configured (missing ZAI_API_KEY)");
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
      // Chatbot answers should be fast — disable extended thinking by default
      thinking: { type: "disabled" },
    }),
    signal: AbortSignal.timeout(input.timeoutMs ?? 25_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GLM API ${res.status}: ${body.slice(0, 240)}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("GLM returned an empty response");
  }
  return content;
}
