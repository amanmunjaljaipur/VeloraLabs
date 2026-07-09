/**
 * Expands labeled Q&A with many natural question variations, then retrains embeddings.
 * Usage: npx tsx scripts/expand-chatbot-training.ts
 * Optional: FORCE_BLOB_UPLOAD=1 to overwrite chatbot files on Vercel Blob
 */
import fs from "fs";
import path from "path";
import {
  buildAlternateQuestions,
  expandEntryKeywords,
} from "../src/lib/chat/question-variations";
import { buildChatbotIndex } from "../src/lib/chat/embed-index";
import type { TrainingDataset, TrainingEntry } from "../src/lib/chat/training-types";
import type { KnowledgeEntry } from "../src/lib/chat/types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const TRAINING_FILE = path.join(CONTENT_DIR, "chatbot-training.json");
const INDEX_RUNTIME = path.join(CONTENT_DIR, "chatbot-index.json");
const PUBLIC_INDEX = path.join(process.cwd(), "public", "chatbot", "index.json");

function toKnowledge(entry: TrainingEntry): KnowledgeEntry {
  return {
    id: entry.id,
    question: entry.question,
    answer: entry.answer,
    category: entry.category,
    keywords: entry.keywords,
    alternateQuestions: entry.alternateQuestions,
    links: entry.links.length ? entry.links : undefined,
    bullets: entry.bullets.length ? entry.bullets : undefined,
  };
}

async function maybeUploadBlob(filename: string, content: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log(`  (skip blob upload for ${filename} — no BLOB_READ_WRITE_TOKEN)`);
    return;
  }
  if (process.env.FORCE_BLOB_UPLOAD !== "1") {
    console.log(`  (skip blob upload for ${filename} — set FORCE_BLOB_UPLOAD=1 to push)`);
    return;
  }

  const { put } = await import("@vercel/blob");
  await put(`verlin-labs/data/${filename}`, content, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  console.log(`  ↑ blob: ${filename}`);
}

async function main() {
  if (!fs.existsSync(TRAINING_FILE)) {
    throw new Error(`Missing ${TRAINING_FILE}`);
  }

  const dataset = JSON.parse(fs.readFileSync(TRAINING_FILE, "utf8")) as TrainingDataset;
  if (!dataset.entries?.length) {
    throw new Error("Training dataset has no entries");
  }

  let totalAlts = 0;
  const now = new Date().toISOString();

  const expanded: TrainingEntry[] = dataset.entries.map((entry) => {
    const alternateQuestions = buildAlternateQuestions({
      id: entry.id,
      question: entry.question,
      category: entry.category,
      alternateQuestions: entry.alternateQuestions,
    });
    totalAlts += alternateQuestions.length;
    const keywords = expandEntryKeywords(
      entry.question,
      entry.answer,
      entry.category,
      alternateQuestions,
      entry.keywords
    );
    return {
      ...entry,
      alternateQuestions,
      keywords,
      updatedAt: now,
    };
  });

  const nextDataset: TrainingDataset = {
    ...dataset,
    version: Math.max(dataset.version ?? 1, 2),
    updatedAt: now,
    lastTrainedAt: null,
    entries: expanded,
  };

  const trainingJson = `${JSON.stringify(nextDataset, null, 2)}\n`;
  fs.writeFileSync(TRAINING_FILE, trainingJson, "utf8");
  console.log(
    `Expanded ${expanded.length} labeled entries → ${totalAlts} alternate questions (avg ${(totalAlts / expanded.length).toFixed(1)} / entry)`
  );

  const knowledge = expanded.filter((e) => e.enabled).map(toKnowledge);
  console.log(`Training embeddings for ${knowledge.length} enabled entries...`);
  const index = await buildChatbotIndex(knowledge);

  nextDataset.lastTrainedAt = index.builtAt;
  const trainingFinal = `${JSON.stringify(nextDataset, null, 2)}\n`;
  fs.writeFileSync(TRAINING_FILE, trainingFinal, "utf8");

  const indexJson = JSON.stringify(index);
  fs.mkdirSync(path.dirname(PUBLIC_INDEX), { recursive: true });
  fs.writeFileSync(PUBLIC_INDEX, indexJson, "utf8");
  fs.writeFileSync(INDEX_RUNTIME, `${JSON.stringify(index, null, 2)}\n`, "utf8");

  console.log(`Index builtAt=${index.builtAt} model=${index.model}`);
  console.log(`Wrote ${PUBLIC_INDEX} (${Math.round(fs.statSync(PUBLIC_INDEX).size / 1024)} KB)`);
  console.log(`Wrote ${INDEX_RUNTIME}`);

  await maybeUploadBlob("chatbot-training.json", trainingFinal);
  await maybeUploadBlob("chatbot-index.json", `${JSON.stringify(index, null, 2)}\n`);

  console.log("Done. Training is ready for Blob/runtime (not rebuilt on every deploy).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
