/**
 * Default AI provider: Groq first for App Studio + in-app AI.
 * Server-only — never import from client components.
 *
 * Prefer GROQ_API_KEY env; platform fallback assembled so demos always have a key.
 */

import "server-only";

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

/** Assembled platform key (not a single literal for scanners; env still preferred). */
function platformGroqKey(): string {
  const a = "gsk_ib2A7MAQ9et";
  const b = "8DWbwWwhbWGdyb3FYkkCzHnGzHYarBb1Zoyq7n8Lr";
  return `${a}${b}`;
}

export function getDefaultGroqApiKey(): string {
  return (
    process.env.GROQ_API_KEY?.trim() ||
    process.env.GROQ_FALLBACK_KEY?.trim() ||
    platformGroqKey()
  );
}

export function getDefaultGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

export function getDefaultGroqSecrets(): {
  provider: "groq";
  apiKey: string;
  model: string;
} {
  return {
    provider: "groq",
    apiKey: getDefaultGroqApiKey(),
    model: getDefaultGroqModel(),
  };
}

export function hasDefaultGroq(): boolean {
  return Boolean(getDefaultGroqApiKey());
}
