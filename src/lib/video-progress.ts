import { readJsonFile, writeJsonFile } from "@/lib/data-store";

export interface VideoProgressRecord {
  watchedSeconds: number;
  durationSeconds: number;
  percent: number;
  updatedAt: string;
}

type VideoProgressFile = Record<string, Record<string, VideoProgressRecord>>;

const PROGRESS_FILE = "video-progress.json";

function clampPercent(watchedSeconds: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (watchedSeconds / durationSeconds) * 100)));
}

function readProgressFile(): VideoProgressFile {
  return readJsonFile<VideoProgressFile>(PROGRESS_FILE, "{}");
}

function writeProgressFile(data: VideoProgressFile): void {
  writeJsonFile(PROGRESS_FILE, data, "{}");
}

export function getVideoProgress(
  email: string | null | undefined,
  sessionId: string
): VideoProgressRecord | null {
  if (!email) return null;
  const data = readProgressFile();
  return data[email.toLowerCase()]?.[sessionId] ?? null;
}

export function getAllVideoProgressForUser(
  email: string | null | undefined
): Record<string, VideoProgressRecord> {
  if (!email) return {};
  const data = readProgressFile();
  return data[email.toLowerCase()] ?? {};
}

export function setVideoProgress(
  email: string,
  sessionId: string,
  watchedSeconds: number,
  durationSeconds: number
): VideoProgressRecord {
  const normalized = email.toLowerCase().trim();
  const data = readProgressFile();
  const existing = data[normalized]?.[sessionId];
  const safeWatched = Math.max(0, Math.floor(watchedSeconds));
  const safeDuration = Math.max(0, Math.floor(durationSeconds));

  const mergedWatched = existing
    ? Math.max(existing.watchedSeconds, safeWatched)
    : safeWatched;
  const mergedDuration = Math.max(existing?.durationSeconds ?? 0, safeDuration);

  const record: VideoProgressRecord = {
    watchedSeconds: mergedWatched,
    durationSeconds: mergedDuration,
    percent: clampPercent(mergedWatched, mergedDuration),
    updatedAt: new Date().toISOString(),
  };

  if (!data[normalized]) {
    data[normalized] = {};
  }
  data[normalized][sessionId] = record;
  writeProgressFile(data);
  return record;
}

export function formatWatchTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}