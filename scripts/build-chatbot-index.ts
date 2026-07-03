/**
 * Trains the Verlin Labs chatbot knowledge index.
 * Uses Xenova/all-MiniLM-L6-v2 (small embedding model) to embed all Q&A entries.
 * Output is served statically — no external API needed at runtime.
 */
import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";
import { collectKnowledgeEntries } from "../src/lib/chat/knowledge-sources";
import type { ChatbotIndex } from "../src/lib/chat/types";

const MODEL = "Xenova/all-MiniLM-L6-v2";
const OUT_DIR = path.join(process.cwd(), "public", "chatbot");
const OUT_FILE = path.join(OUT_DIR, "index.json");

async function embedTexts(
  embedder: Awaited<ReturnType<typeof pipeline>>,
  texts: string[]
): Promise<number[][]> {
  const vectors: number[][] = [];
  for (const text of texts) {
    const output = await embedder(text, { pooling: "mean", normalize: true } as const);
    vectors.push(Array.from(output.data as Float32Array));
  }
  return vectors;
}

async function main() {
  console.log("Collecting knowledge entries...");
  const entries = collectKnowledgeEntries();
  console.log(`Found ${entries.length} unique Q&A entries`);

  console.log(`Loading embedding model: ${MODEL}`);
  const embedder = await pipeline("feature-extraction", MODEL);

  const texts = entries.map(
    (e) => `${e.question} ${e.answer} ${e.category} ${e.keywords.join(" ")}`
  );

  console.log("Generating embeddings...");
  const embeddings = await embedTexts(embedder, texts);

  const index: ChatbotIndex = {
    version: 1,
    model: MODEL,
    builtAt: new Date().toISOString(),
    entries: entries.map((entry, i) => ({
      ...entry,
      embedding: embeddings[i],
    })),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(index));

  const sizeKb = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`Wrote ${OUT_FILE} (${sizeKb} KB, ${entries.length} entries)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});