import fs from "fs";
import path from "path";
import { readRuntimeIndex } from "./training-store";
import type { ChatbotIndex } from "./types";

const STATIC_INDEX = path.join(process.cwd(), "public", "chatbot", "index.json");

export function loadChatbotIndex(): ChatbotIndex | null {
  const runtime = readRuntimeIndex<ChatbotIndex>();
  if (runtime?.entries?.length) return runtime;

  try {
    if (fs.existsSync(STATIC_INDEX)) {
      return JSON.parse(fs.readFileSync(STATIC_INDEX, "utf8")) as ChatbotIndex;
    }
  } catch {
    // fall through
  }
  return null;
}