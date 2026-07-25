import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Generation job records - the spine of the pipeline (script -> voice ->
 * avatar -> QA -> delivery). One record per user-submitted render, carrying
 * every agent's output/decision so the whole run is reconstructable from
 * the record alone (Section 12's audit requirement).
 */

const JOBS_FILE = "avatar-jobs.json";
const DEFAULT_JSON = "[]";

export type JobStatus =
  | "queued"
  | "moderating"
  | "generating_voice"
  | "generating_avatar"
  | "qa_check"
  | "complete"
  | "failed"
  | "rejected";

export interface JobStorageRef {
  provider: "blob" | "google_drive";
  url: string;
  /** Drive file ID, if provider is google_drive - needed for later API calls (rename/delete/share). */
  driveFileId?: string;
}

export type JobMode = "single" | "long_form";

/**
 * One chained clip in a long-form video (Section: "20-minute video from
 * multiple 10-second clips"). Each segment is generated independently, with
 * `lastFrameRef` from segment N handed to segment N+1's avatar generation
 * call as its `referenceImageUrl` so the avatar doesn't visibly jump
 * between clips. `attemptedModels` is the multi-model-failover audit trail
 * ("if one model's free quota is exhausted, use another until all are
 * exhausted") - see agents/model-failover.ts.
 */
export interface LongFormSegmentState {
  index: number;
  text: string;
  status: "pending" | "generating_voice" | "generating_avatar" | "complete" | "failed";
  voiceModelIdUsed: string | null;
  avatarModelIdUsed: string | null;
  audioRef: JobStorageRef | null;
  videoRef: JobStorageRef | null;
  lastFrameRef: JobStorageRef | null;
  attemptedModels: string[];
  error: string | null;
}

export interface AvatarJob {
  id: string;
  email: string;
  categoryId: string;
  script: string;
  voiceModelId: string;
  avatarModelId: string;
  qualityTier: "standard" | "high" | "best";
  avatarProfileId: string | null;
  status: JobStatus;
  tokensReserved: number;
  moderationNote: string | null;
  qaScore: number | null;
  qaRetryCount: number;
  outputVideo: JobStorageRef | null;
  transcriptSegments: TranscriptSegment[] | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  /** "single" (default, one clip) or "long_form" (many chained clips stitched together, up to ~20 min). */
  mode: JobMode;
  /** Only set when mode is "long_form" - the user's requested total length. */
  targetDurationMinutes: number | null;
  /** Only set when mode is "long_form" - per-clip plan + progress. Processed incrementally (see long-form-agent.ts), safe to resume across multiple invocations/cron sweeps. */
  segments: LongFormSegmentState[] | null;
}

export interface TranscriptSegment {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  /** Set once a segment has been edited and needs its audio/video re-rendered. */
  dirty: boolean;
}

async function readAll(): Promise<AvatarJob[]> {
  await ensureDataFileHydrated(JOBS_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<AvatarJob[]>(JOBS_FILE, DEFAULT_JSON);
}
async function writeAll(items: AvatarJob[]): Promise<void> {
  await writeJsonFileAsync(JOBS_FILE, items, DEFAULT_JSON);
}

export async function listJobsForUser(email: string): Promise<AvatarJob[]> {
  const all = await readAll();
  return all.filter((j) => j.email === email.toLowerCase()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getJob(id: string, email: string): Promise<AvatarJob | null> {
  const all = await readAll();
  return all.find((j) => j.id === id && j.email === email.toLowerCase()) ?? null;
}

/** Admin/agent-facing lookup, not scoped to a caller's own email - used by the queue processor and admin moderation views. */
export async function getJobById(id: string): Promise<AvatarJob | null> {
  const all = await readAll();
  return all.find((j) => j.id === id) ?? null;
}

export async function listQueuedJobs(): Promise<AvatarJob[]> {
  const all = await readAll();
  return all
    .filter((j) => !["complete", "failed", "rejected"].includes(j.status))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createJob(input: {
  email: string;
  categoryId: string;
  script: string;
  voiceModelId: string;
  avatarModelId: string;
  qualityTier: "standard" | "high" | "best";
  avatarProfileId: string | null;
  tokensReserved: number;
  mode?: JobMode;
  targetDurationMinutes?: number | null;
  segments?: LongFormSegmentState[] | null;
}): Promise<AvatarJob> {
  const all = await readAll();
  const now = new Date().toISOString();
  const job: AvatarJob = {
    id: randomUUID(),
    email: input.email.toLowerCase(),
    categoryId: input.categoryId,
    script: input.script,
    voiceModelId: input.voiceModelId,
    avatarModelId: input.avatarModelId,
    qualityTier: input.qualityTier,
    avatarProfileId: input.avatarProfileId,
    status: "queued",
    tokensReserved: input.tokensReserved,
    moderationNote: null,
    qaScore: null,
    qaRetryCount: 0,
    outputVideo: null,
    transcriptSegments: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    mode: input.mode ?? "single",
    targetDurationMinutes: input.targetDurationMinutes ?? null,
    segments: input.segments ?? null,
  };
  all.push(job);
  await writeAll(all);
  return job;
}

export async function updateJob(id: string, patch: Partial<Omit<AvatarJob, "id" | "email" | "createdAt">>): Promise<AvatarJob | null> {
  const all = await readAll();
  const idx = all.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx]!, ...patch, updatedAt: new Date().toISOString() };
  await writeAll(all);
  return all[idx]!;
}
