import { defaultModelForProvider } from "@/lib/app-builder/llm";
import type { AppLlmSecrets, LlmProviderKind } from "@/lib/app-builder/types";

/**
 * Platform default Grok key for App Builder (interview design + generate).
 * Set via env only — never hardcode in source or commit secrets.
 *
 *   XAI_API_KEY=xai-...
 *   XAI_MODEL=grok-3-mini   (optional)
 */
export function getPlatformAppBuilderSecrets(): AppLlmSecrets | null {
  const xai = process.env.XAI_API_KEY?.trim();
  if (xai) {
    return {
      provider: "xai",
      apiKey: xai,
      model: process.env.XAI_MODEL?.trim() || defaultModelForProvider("xai"),
    };
  }

  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      provider: "groq",
      apiKey: groq,
      model: process.env.GROQ_MODEL?.trim() || defaultModelForProvider("groq"),
    };
  }

  return null;
}

export function hasPlatformAppBuilderLlm(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim());
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
