import { getDefaultGroqSecrets } from "@/lib/ai/default-groq";
import { defaultModelForProvider } from "@/lib/app-builder/llm";
import type { AppLlmSecrets, LlmProviderKind } from "@/lib/app-builder/types";

/**
 * Platform default LLM for App Builder / Studio: Groq first (GROQ_API_KEY).
 */
export function getPlatformAppBuilderSecrets(): AppLlmSecrets | null {
  const groq = getDefaultGroqSecrets();
  if (groq) return groq;

  const xai = process.env.XAI_API_KEY?.trim();
  if (xai) {
    return {
      provider: "xai",
      apiKey: xai,
      model: process.env.XAI_MODEL?.trim() || defaultModelForProvider("xai"),
    };
  }
  return null;
}

export function hasPlatformAppBuilderLlm(): boolean {
  return Boolean(getDefaultGroqSecrets() || process.env.XAI_API_KEY?.trim());
}

/** Merge optional request secrets over platform default (request key wins). */
export function resolveAppBuilderSecrets(input?: {
  apiKey?: string;
  provider?: LlmProviderKind;
  model?: string;
  baseUrl?: string;
}): AppLlmSecrets | null {
  if (input?.apiKey?.trim()) {
    return {
      provider: input.provider || "xai",
      apiKey: input.apiKey.trim(),
      model: input.model?.trim() || defaultModelForProvider(input.provider || "xai"),
      baseUrl: input.baseUrl,
    };
  }
  return getPlatformAppBuilderSecrets();
}
