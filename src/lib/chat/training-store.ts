import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import { collectLegacyKnowledgeEntries } from "@/lib/chat/knowledge-sources";
import type { KnowledgeEntry } from "./types";
import type { TrainingDataset, TrainingEntry, TrainingEntryInput, TrainingSource } from "./training-types";

const TRAINING_FILE = "chatbot-training.json";
const INDEX_RUNTIME_FILE = "chatbot-index.json";

const EMPTY_DATASET: TrainingDataset = {
  version: 1,
  updatedAt: new Date().toISOString(),
  lastTrainedAt: null,
  entries: [],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function buildKeywords(
  question: string,
  answer: string,
  category: string,
  alternateQuestions: string[],
  extra?: string[]
): string[] {
  const words = new Set([
    ...tokenize(question),
    ...tokenize(answer),
    ...tokenize(category),
    ...alternateQuestions.flatMap(tokenize),
    ...(extra ?? []),
  ]);
  return Array.from(words);
}

function newId(question: string, existing: Set<string>): string {
  let base = slugify(question) || "entry";
  let id = base;
  let n = 1;
  while (existing.has(id)) {
    id = `${base}-${n++}`;
  }
  existing.add(id);
  return id;
}

/** Curated alternate phrasings for high-traffic intents */
const ENHANCED_ALTS: Record<string, string[]> = {
  "what-is-a-mental-model": [
    "mental model",
    "define mental model",
    "explain mental models",
    "what are mental models",
  ],
  "what-is-the-introductory-pricing-offer": [
    "introductory offer",
    "intro pricing",
    "70% off",
    "discount offer",
    "sale price",
    "pricing model",
    "help with pricing",
  ],
  "what-are-the-course-prices": [
    "course price",
    "how much do courses cost",
    "program cost",
    "fees",
    "rupees",
    "pricing",
  ],
  "do-i-get-a-certificate": [
    "certificate",
    "certification",
    "completion certificate",
    "do you give certificates",
  ],
};

function legacyToTraining(legacy: KnowledgeEntry): TrainingEntryInput {
  const id = slugify(legacy.question);
  return {
    category: legacy.category,
    question: legacy.question,
    alternateQuestions: ENHANCED_ALTS[id] ?? [],
    answer: legacy.answer,
    bullets: legacy.bullets ?? [],
    keywords: legacy.keywords,
    links: legacy.links ?? [],
    enabled: true,
  };
}

function seedDataset(): TrainingDataset {
  const legacy = collectLegacyKnowledgeEntries();
  const ids = new Set<string>();
  const now = new Date().toISOString();

  const entries: TrainingEntry[] = legacy.map((item) => {
    const input = legacyToTraining(item);
    const id = newId(item.question, ids);
    return {
      id,
      category: input.category,
      question: input.question,
      alternateQuestions: input.alternateQuestions ?? [],
      answer: input.answer,
      bullets: input.bullets ?? [],
      keywords:
        input.keywords ??
        buildKeywords(
          input.question,
          input.answer,
          input.category,
          input.alternateQuestions ?? []
        ),
      links: input.links ?? [],
      enabled: true,
      source: "seed",
      updatedAt: now,
    };
  });

  return { version: 1, updatedAt: now, lastTrainedAt: null, entries };
}

export function readTrainingDataset(): TrainingDataset {
  const data = readJsonFile<TrainingDataset>(TRAINING_FILE, JSON.stringify(EMPTY_DATASET));
  if (!data.entries?.length) {
    const seeded = seedDataset();
    writeJsonFile(TRAINING_FILE, seeded);
    return seeded;
  }
  return data;
}

export function writeTrainingDataset(dataset: TrainingDataset): void {
  writeJsonFile(TRAINING_FILE, dataset);
}

export function trainingToKnowledge(entry: TrainingEntry): KnowledgeEntry {
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

export function getActiveKnowledgeEntries(): KnowledgeEntry[] {
  return readTrainingDataset()
    .entries.filter((e) => e.enabled)
    .map(trainingToKnowledge);
}

export function createTrainingEntry(
  input: TrainingEntryInput,
  source: TrainingSource,
  updatedBy?: string
): TrainingEntry {
  const dataset = readTrainingDataset();
  const ids = new Set(dataset.entries.map((e) => e.id));
  const alternateQuestions = input.alternateQuestions ?? [];
  const now = new Date().toISOString();

  const entry: TrainingEntry = {
    id: newId(input.question, ids),
    category: input.category.trim(),
    question: input.question.trim(),
    alternateQuestions,
    answer: input.answer.trim(),
    bullets: input.bullets ?? [],
    keywords:
      input.keywords ??
      buildKeywords(input.question, input.answer, input.category, alternateQuestions),
    links: input.links ?? [],
    enabled: input.enabled ?? true,
    source,
    updatedAt: now,
    updatedBy,
  };

  dataset.entries.push(entry);
  dataset.updatedAt = now;
  writeTrainingDataset(dataset);
  return entry;
}

export function updateTrainingEntry(
  id: string,
  input: Partial<TrainingEntryInput>,
  updatedBy?: string
): TrainingEntry | null {
  const dataset = readTrainingDataset();
  const idx = dataset.entries.findIndex((e) => e.id === id);
  if (idx < 0) return null;

  const current = dataset.entries[idx]!;
  const alternateQuestions = input.alternateQuestions ?? current.alternateQuestions;
  const question = input.question?.trim() ?? current.question;
  const answer = input.answer?.trim() ?? current.answer;
  const category = input.category?.trim() ?? current.category;

  const updated: TrainingEntry = {
    ...current,
    category,
    question,
    alternateQuestions,
    answer,
    bullets: input.bullets ?? current.bullets,
    keywords:
      input.keywords ??
      buildKeywords(question, answer, category, alternateQuestions),
    links: input.links ?? current.links,
    enabled: input.enabled ?? current.enabled,
    source: current.source === "seed" ? "manual" : current.source,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  dataset.entries[idx] = updated;
  dataset.updatedAt = updated.updatedAt;
  writeTrainingDataset(dataset);
  return updated;
}

export function deleteTrainingEntry(id: string): boolean {
  const dataset = readTrainingDataset();
  const before = dataset.entries.length;
  dataset.entries = dataset.entries.filter((e) => e.id !== id);
  if (dataset.entries.length === before) return false;
  dataset.updatedAt = new Date().toISOString();
  writeTrainingDataset(dataset);
  return true;
}

export function importTrainingEntries(
  rows: TrainingEntryInput[],
  mode: "merge" | "replace",
  updatedBy?: string
): { imported: number; total: number } {
  const dataset = readTrainingDataset();
  const now = new Date().toISOString();
  const ids = new Set(mode === "merge" ? dataset.entries.map((e) => e.id) : []);

  if (mode === "replace") {
    dataset.entries = [];
  }

  let imported = 0;
  for (const row of rows) {
    if (!row.question?.trim() || !row.answer?.trim()) continue;
    const alternateQuestions = row.alternateQuestions ?? [];
    dataset.entries.push({
      id: newId(row.question, ids),
      category: (row.category?.trim() || "General"),
      question: row.question.trim(),
      alternateQuestions,
      answer: row.answer.trim(),
      bullets: row.bullets ?? [],
      keywords:
        row.keywords ??
        buildKeywords(row.question, row.answer, row.category, alternateQuestions),
      links: row.links ?? [],
      enabled: row.enabled ?? true,
      source: "import",
      updatedAt: now,
      updatedBy,
    });
    imported++;
  }

  dataset.updatedAt = now;
  writeTrainingDataset(dataset);
  return { imported, total: dataset.entries.length };
}

export function markTrainingComplete(): void {
  const dataset = readTrainingDataset();
  dataset.lastTrainedAt = new Date().toISOString();
  writeTrainingDataset(dataset);
}

export function saveRuntimeIndex(index: unknown): void {
  writeJsonFile(INDEX_RUNTIME_FILE, index);
}

export function readRuntimeIndex<T>(): T | null {
  try {
    return readJsonFile<T>(INDEX_RUNTIME_FILE, "null");
  } catch {
    return null;
  }
}