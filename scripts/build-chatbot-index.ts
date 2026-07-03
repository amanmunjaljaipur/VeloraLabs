/**
 * Trains the Verlin Labs chatbot from labeled training data.
 */
import fs from "fs";
import path from "path";
import { buildChatbotIndex } from "../src/lib/chat/embed-index";
import { getActiveKnowledgeEntries, saveRuntimeIndex } from "../src/lib/chat/training-store";

const OUT_DIR = path.join(process.cwd(), "public", "chatbot");
const OUT_FILE = path.join(OUT_DIR, "index.json");

async function main() {
  const entries = getActiveKnowledgeEntries();
  console.log(`Training ${entries.length} labeled Q&A entries...`);

  const index = await buildChatbotIndex(entries);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(index));
  saveRuntimeIndex(index);

  const sizeKb = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`Wrote ${OUT_FILE} (${sizeKb} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});