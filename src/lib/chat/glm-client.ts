/**
 * @deprecated Use `@/lib/chat/llm-client` — free-first Groq / Gemini / Z.ai.
 */
export {
  getLlmConfig as getGlmConfig,
  isLlmConfigured as isGlmConfigured,
  type ChatCompletionMessage,
  type LlmConfig as GlmConfig,
} from "@/lib/chat/llm-client";

import { createChatCompletion } from "@/lib/chat/llm-client";
import type { ChatCompletionMessage } from "@/lib/chat/llm-client";

/** @deprecated Prefer createChatCompletion from llm-client */
export async function createGlmChatCompletion(input: {
  messages: ChatCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const result = await createChatCompletion(input);
  return result.content;
}
