import fs from "fs";
import path from "path";
import type { ChatbotIndex } from "./types";

const STATIC_INDEX = path.join(process.cwd(), "public", "chatbot", "index.json");

export interface DeployedChatbotIndexMeta {
  builtAt: string;
  entryCount: number;
  model: string;
  source: "static" | "runtime";
}

export function getDeployedChatbotIndexMeta(): DeployedChatbotIndexMeta | null {
  try {
    if (fs.existsSync(STATIC_INDEX)) {
      const index = JSON.parse(fs.readFileSync(STATIC_INDEX, "utf8")) as ChatbotIndex;
      if (index.entries?.length) {
        return {
          builtAt: index.builtAt,
          entryCount: index.entries.length,
          model: index.model,
          source: "static",
        };
      }
    }
  } catch {
    // fall through
  }
  return null;
}