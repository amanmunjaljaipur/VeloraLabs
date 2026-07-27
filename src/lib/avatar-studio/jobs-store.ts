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
  /** Primary face / avatar training sample (optional). */
  avatarProfileId: string | null;
  /** Primary voice training sample (optional — free TTS used when null). */
  voiceProfileId: string | null;
  /** All selected characters/voices for this job (multi-cast UI). */
  castProfileIds: string[];
  status: JobStatus;
  tokensReserved: number;
  moderationNote: string | null;
  qaScore: number | null;
  qaRetryCount: number;
  outputVideo: JobStorageRef | null;
  /** Free Presenter path: narrated audio (true lip-sync jobs leave this null). */
  outputAudio: JobStorageRef | null;
  /** Free Presenter path: portrait / still frame shown with the audio. */
  outputPoster: JobStorageRef | null;
  /**
   * "video" = real MP4 (lip-sync host OR free animated presenter).
   * "presenter" = legacy still + audio only (fallback if animation fails).
   */
  outputKind: "video" | "presenter" | null;
  /** 0–100 live progress for UI (not only coarse status steps). */
  progressPercent: number;
  /** Human-readable step, e.g. "Synthesizing speech…". */
  progressLabel: string | null;
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
  /**
   * Optional free royalty-free meme / b-roll inserts (script-aware).
   * Stitched after presenter video when present.
   */
  memePlacements: {
    placementId: string;
    clipId: string;
    positionRatio: number;
    scriptSnippet: string;
    label: string;
    mood: string;
    sourceUrl?: string;
  }[] | null;
  /** Detected video tone for meme picks */
  videoGenre: string | null;
}

export interface TranscriptSegment {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  /** Set once a segment has been edited and needs its audio/video re-rendered. */
  dirty: boolean;
}

function normalizeJob(job: AvatarJob): AvatarJob {
  return {
    ...job,
    avatarProfileId: job.avatarProfileId ?? null,
    voiceProfileId: job.voiceProfileId ?? null,
    castProfileIds: Array.isArray(job.castProfileIds) ? job.castProfileIds : [],
    outputAudio: job.outputAudio ?? null,
    outputPoster: job.outputPoster ?? null,
    outputKind: job.outputKind ?? null,
    progressPercent: typeof job.progressPercent === "number" ? job.progressPercent : statusToProgress(job.status),
    progressLabel: job.progressLabel ?? null,
    memePlacements: Array.isArray(job.memePlacements) ? job.memePlacements : null,
    videoGenre: job.videoGenre ?? null,
  };
}

function statusToProgress(status: JobStatus): number {
  switch (status) {
    case "queued":
      return 5;
    case "moderating":
      return 12;
    case "generating_voice":
      return 35;
    case "generating_avatar":
      return 70;
    case "qa_check":
      return 90;
    case "complete":
      return 100;
    case "failed":
    case "rejected":
      return 100;
    default:
      return 0;
  }
}

async function readAll(): Promise<AvatarJob[]> {
  await ensureDataFileHydrated(JOBS_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<AvatarJob[]>(JOBS_FILE, DEFAULT_JSON).map(normalizeJob);
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

/**
 * Terminal (failed/rejected) jobs updated within the lookback window - feeds
 * the avatar-studio-queue cron's token-reconciliation pass, which
 * double-checks the ledger and refunds anything the in-pipeline
 * refund-on-failure logic missed (see token-ledger-store.ts's
 * getReservedTokensForJob/hasAnyRefund). Bounded by time so this never
 * turns into an unbounded scan of the whole jobs history as the file grows.
 */
export async function listRecentTerminalJobs(lookbackMs: number): Promise<AvatarJob[]> {
  const all = await readAll();
  const cutoff = Date.now() - lookbackMs;
  return all.filter((j) => ["failed", "rejected"].includes(j.status) && new Date(j.updatedAt).getTime() >= cutoff);
}

export async function createJob(input: {
  email: string;
  categoryId: string;
  script: string;
  voiceModelId: string;
  avatarModelId: string;
  qualityTier: "standard" | "high" | "best";
  avatarProfileId: string | null;
  voiceProfileId?: string | null;
  castProfileIds?: string[];
  tokensReserved: number;
  mode?: JobMode;
  targetDurationMinutes?: number | null;
  segments?: LongFormSegmentState[] | null;
  memePlacements?: AvatarJob["memePlacements"];
  videoGenre?: string | null;
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
    voiceProfileId: input.voiceProfileId ?? null,
    castProfileIds: input.castProfileIds ?? [],
    status: "queued",
    tokensReserved: input.tokensReserved,
    moderationNote: null,
    qaScore: null,
    qaRetryCount: 0,
    outputVideo: null,
    outputAudio: null,
    outputPoster: null,
    outputKind: null,
    progressPercent: 5,
    progressLabel: "Queued — starting pipeline…",
    transcriptSegments: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    mode: input.mode ?? "single",
    targetDurationMinutes: input.targetDurationMinutes ?? null,
    segments: input.segments ?? null,
    memePlacements: input.memePlacements ?? null,
    videoGenre: input.videoGenre ?? null,
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
