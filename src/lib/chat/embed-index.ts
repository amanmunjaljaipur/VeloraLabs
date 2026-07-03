import { pipeline } from "@xenova/transformers";
import type { KnowledgeEntry } from "./types";
import type { ChatbotIndex } from "./types";

export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

export function entryEmbeddingText(entry: KnowledgeEntry): string {
  const alts = entry.alternateQuestions?.join(" ") ?? "";
  return `${entry.question} ${alts} ${entry.answer} ${entry.category} ${entry.keywords.join(" ")}`;
}

async function embedTexts(
  embedder: Awaited<ReturnType<typeof pipeline>>,
  texts: string[]
): Promise<number[][]> {
  const vectors: number[][] = [];
  for (const text of texts) {
    // transformers.js option types are overly strict for normalize
    const output = await (embedder as (t: string, o: object) => Promise<{ data: Float32Array }>)(
      text,
      { pooling: "mean", normalize: true }
    );
    vectors.push(Array.from(output.data as Float32Array));
  }
  return vectors;
}

export async function buildChatbotIndex(entries: KnowledgeEntry[]): Promise<ChatbotIndex> {
  const embedder = await pipeline("feature-extraction", EMBEDDING_MODEL);
  const texts = entries.map(entryEmbeddingText);
  const embeddings = await embedTexts(embedder, texts);

  return {
    version: 1,
    model: EMBEDDING_MODEL,
    builtAt: new Date().toISOString(),
    entries: entries.map((entry, i) => ({
      ...entry,
      embedding: embeddings[i],
    })),
  };
}