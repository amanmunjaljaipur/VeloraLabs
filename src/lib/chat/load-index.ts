import fs from "fs";
import path from "path";
import type { ChatbotIndex } from "./types";

const INDEX_PATHS = [
  path.join(process.cwd(), "public", "chatbot", "index.json"),
  path.join(process.cwd(), "content", "chatbot-index.json"),
];

export function loadChatbotIndex(): ChatbotIndex | null {
  for (const filePath of INDEX_PATHS) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf8")) as ChatbotIndex;
      }
    } catch {
      // try next path
    }
  }
  return null;
}