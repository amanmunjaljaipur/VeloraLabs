import { getDefaultGroqSecrets } from "@/lib/ai/default-groq";
import { defaultModelForProvider } from "@/lib/app-builder/llm";
import type { AppLlmSecrets, LlmProviderKind } from "@/lib/app-builder/types";

/**
 * Platform default LLM for App Builder / Studio: Groq first (GROQ_API_KEY).
 */
export function getPlatformAppBuilderSecrets(): AppLlmSecrets | null {
  return getDefaultGroqSecrets();
}

export function hasPlatformAppBuilderLlm(): boolean {
  return true;
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
