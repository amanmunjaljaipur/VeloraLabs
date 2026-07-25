import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Daily fine-tuning cycle history + control (Section 7, and the explicit
 * requirement that training stay in the platform owner's control with
 * durable access to the underlying data). Every cycle - run, skipped, or
 * failed - gets a permanent record here, NEVER auto-deleted, listing the
 * exact feedback entry IDs it drew from (data lineage, per Section 12).
 * This is what "always be able to access and keep the data" means in
 * practice: the batch history + the feedback entries it references
 * (feedback-store.ts) are both plain Blob-backed JSON on this platform's
 * own storage - nothing about training data lives inside a third-party
 * model vendor's opaque system.
 *
 * The pause flag gives the owner a hard stop: while paused, the (stubbed,
 * not-yet-built) Fine-Tuning Orchestrator Agent must skip every cycle
 * rather than run one, checked at the top of that agent's entry point.
 */

const BATCHES_FILE = "avatar-training-batches.json";
const SETTINGS_FILE = "avatar-training-settings.json";
const DEFAULT_BATCHES_JSON = "[]";
const DEFAULT_SETTINGS_JSON = '{"paused":false,"pausedBy":null,"pausedAt":null}';

export type TrainingBatchStatus =
  | "pending"
  | "running"
  | "passed_deployed"
  | "failed_evaluation"
  | "skipped_insufficient_data"
  | "skipped_paused"
  | "rolled_back";

export interface TrainingBatch {
  id: string;
  triggeredBy: "cron" | "manual";
  triggeredByEmail: string | null;
  windowStart: string;
  windowEnd: string;
  modelId: string | null;
  correctionType: string | null;
  /** Exact data lineage - which feedback entries this batch drew from. */
  feedbackEntryIds: string[];
  status: TrainingBatchStatus;
  evaluationNotes: string | null;
  deployedVersion: string | null;
  previousVersion: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface TrainingSettings {
  paused: boolean;
  pausedBy: string | null;
  pausedAt: string | null;
}

async function readBatches(): Promise<TrainingBatch[]> {
  await ensureDataFileHydrated(BATCHES_FILE, DEFAULT_BATCHES_JSON, { force: true });
  return readJsonFile<TrainingBatch[]>(BATCHES_FILE, DEFAULT_BATCHES_JSON);
}
async function writeBatches(items: TrainingBatch[]): Promise<void> {
  await writeJsonFileAsync(BATCHES_FILE, items, DEFAULT_BATCHES_JSON);
}

export async function listTrainingBatches(limit = 200): Promise<TrainingBatch[]> {
  const all = await readBatches();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function createTrainingBatch(input: {
  triggeredBy: "cron" | "manual";
  triggeredByEmail: string | null;
  windowStart: string;
  windowEnd: string;
  modelId: string | null;
  correctionType: string | null;
  feedbackEntryIds: string[];
  status: TrainingBatchStatus;
}): Promise<TrainingBatch> {
  const all = await readBatches();
  const batch: TrainingBatch = {
    id: randomUUID(),
    ...input,
    evaluationNotes: null,
    deployedVersion: null,
    previousVersion: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  all.push(batch);
  await writeBatches(all);
  return batch;
}

export async function completeTrainingBatch(
  id: string,
  patch: Partial<Pick<TrainingBatch, "status" | "evaluationNotes" | "deployedVersion" | "previousVersion">>
): Promise<TrainingBatch | null> {
  const all = await readBatches();
  const idx = all.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx]!, ...patch, completedAt: new Date().toISOString() };
  await writeBatches(all);
  return all[idx]!;
}

export async function getTrainingSettings(): Promise<TrainingSettings> {
  await ensureDataFileHydrated(SETTINGS_FILE, DEFAULT_SETTINGS_JSON, { force: true });
  return readJsonFile<TrainingSettings>(SETTINGS_FILE, DEFAULT_SETTINGS_JSON);
}

export async function setTrainingPaused(paused: boolean, byEmail: string): Promise<TrainingSettings> {
  const next: TrainingSettings = {
    paused,
    pausedBy: paused ? byEmail : null,
    pausedAt: paused ? new Date().toISOString() : null,
  };
  await writeJsonFileAsync(SETTINGS_FILE, next, DEFAULT_SETTINGS_JSON);
  return next;
}
