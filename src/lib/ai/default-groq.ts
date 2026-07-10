/**
 * Default AI provider for App Studio + in-app AI features: Groq first.
 * Server-only — never import from client components.
 *
 * Set on the server (Vercel / .env.local):
 *   GROQ_API_KEY=gsk_...
 *   GROQ_MODEL=llama-3.3-70b-versatile   (optional)
 *
 * Env wins. Optional GROQ_FALLBACK_KEY can be set on Vercel as a second slot.
 */

import "server-only";

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

/** Resolved Groq API key from environment (required for AI features). */
export function getDefaultGroqApiKey(): string {
  const key =
    process.env.GROQ_API_KEY?.trim() ||
    process.env.GROQ_FALLBACK_KEY?.trim() ||
    "";
  return key;
}

export function getDefaultGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

export function getDefaultGroqSecrets(): {
  provider: "groq";
  apiKey: string;
  model: string;
} | null {
  const apiKey = getDefaultGroqApiKey();
  if (!apiKey) return null;
  return {
    provider: "groq",
    apiKey,
    model: getDefaultGroqModel(),
  };
}

export function hasDefaultGroq(): boolean {
  return Boolean(getDefaultGroqApiKey());
}
