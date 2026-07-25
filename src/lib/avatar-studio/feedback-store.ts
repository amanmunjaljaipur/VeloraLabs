import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";
import { hasCurrentConsent } from "@/lib/avatar-studio/consent-store";

/**
 * Continuous feedback log (Section 7): every correction/edit/regenerate/
 * rating, logged the moment it happens, tagged with consent status so the
 * daily training cycle can filter correctly without re-deriving anything.
 * Consent is snapshotted onto the record AT LOG TIME - if a user withdraws
 * consent later, already-logged entries keep their original tag (matching
 * the spec's disclosed "can't retroactively undo a prior batch" limitation)
 * but stop appearing in NEW entries once withdrawn, since we re-check
 * consent on every write, not once at signup.
 */

const FEEDBACK_FILE = "avatar-feedback.json";
const DEFAULT_JSON = "[]";

export type CorrectionType = "transcript_edit" | "regenerate" | "thumbs_up" | "thumbs_down" | "manual_note";

export interface FeedbackEntry {
  id: string;
  email: string;
  jobId: string;
  modelId: string;
  categoryId: string;
  correctionType: CorrectionType;
  original: string | null;
  corrected: string | null;
  note: string | null;
  /** Snapshotted at write time - see module docstring. */
  consentedForTraining: boolean;
  /** Set once a daily training batch has consumed this entry - keeps the batch idempotent/traceable. */
  consumedByBatchId: string | null;
  createdAt: string;
}

async function readAll(): Promise<FeedbackEntry[]> {
  await ensureDataFileHydrated(FEEDBACK_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<FeedbackEntry[]>(FEEDBACK_FILE, DEFAULT_JSON);
}
async function writeAll(items: FeedbackEntry[]): Promise<void> {
  await writeJsonFileAsync(FEEDBACK_FILE, items, DEFAULT_JSON);
}

export async function logFeedback(input: {
  email: string;
  jobId: string;
  modelId: string;
  categoryId: string;
  correctionType: CorrectionType;
  original?: string | null;
  corrected?: string | null;
  note?: string | null;
}): Promise<FeedbackEntry> {
  const all = await readAll();
  const consented = await hasCurrentConsent(input.email, "training_data");
  const entry: FeedbackEntry = {
    id: randomUUID(),
    email: input.email.toLowerCase(),
    jobId: input.jobId,
    modelId: input.modelId,
    categoryId: input.categoryId,
    correctionType: input.correctionType,
    original: input.original ?? null,
    corrected: input.corrected ?? null,
    note: input.note ?? null,
    consentedForTraining: consented,
    consumedByBatchId: null,
    createdAt: new Date().toISOString(),
  };
  all.push(entry);
  await writeAll(all);
  return entry;
}

export async function listFeedbackForUser(email: string, limit = 100): Promise<FeedbackEntry[]> {
  const all = await readAll();
  return all
    .filter((f) => f.email === email.toLowerCase())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/** Consented, not-yet-consumed entries since `since` - what the next training cycle would pull. Never mutates/deletes anything, so this stays a safe preview for the admin Training Control panel. */
export async function getPendingTrainingPool(since: Date): Promise<FeedbackEntry[]> {
  const all = await readAll();
  const sinceIso = since.toISOString();
  return all.filter((f) => f.consentedForTraining && !f.consumedByBatchId && f.createdAt >= sinceIso);
}

export async function markConsumedByBatch(entryIds: string[], batchId: string): Promise<void> {
  const all = await readAll();
  const idSet = new Set(entryIds);
  for (const entry of all) {
    if (idSet.has(entry.id)) entry.consumedByBatchId = batchId;
  }
  await writeAll(all);
}
