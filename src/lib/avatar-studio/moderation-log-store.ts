import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Every moderation check (approved AND rejected), for the admin moderation
 * queue view - so an admin can see what's being screened and tune
 * strictness or catch false positives/negatives. Moderation itself runs
 * synchronously in the job-creation route before a job record even exists
 * (a rejected script never becomes an AvatarJob), so without this log a
 * rejection would leave no trace anywhere - this is that trace.
 */

const LOG_FILE = "avatar-moderation-log.json";
const DEFAULT_JSON = "[]";
const MAX_ENTRIES = 500;

export interface ModerationLogEntry {
  id: string;
  email: string;
  categoryId: string;
  moderationLevel: "standard" | "elevated";
  scriptExcerpt: string;
  approved: boolean;
  reason: string | null;
  flaggedTerms: string[];
  createdAt: string;
}

async function readAll(): Promise<ModerationLogEntry[]> {
  await ensureDataFileHydrated(LOG_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<ModerationLogEntry[]>(LOG_FILE, DEFAULT_JSON);
}

export async function logModeration(input: {
  email: string;
  categoryId: string;
  moderationLevel: "standard" | "elevated";
  script: string;
  approved: boolean;
  reason: string | null;
  flaggedTerms: string[];
}): Promise<void> {
  const all = await readAll();
  const entry: ModerationLogEntry = {
    id: randomUUID(),
    email: input.email.toLowerCase(),
    categoryId: input.categoryId,
    moderationLevel: input.moderationLevel,
    scriptExcerpt: input.script.slice(0, 300),
    approved: input.approved,
    reason: input.reason,
    flaggedTerms: input.flaggedTerms,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...all].slice(0, MAX_ENTRIES);
  await writeJsonFileAsync(LOG_FILE, next, DEFAULT_JSON);
}

export async function listModerationLog(limit = 100): Promise<ModerationLogEntry[]> {
  const all = await readAll();
  return all.slice(0, limit);
}
