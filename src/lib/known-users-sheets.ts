import fs from "fs";
import path from "path";
import {
  isServiceAccountConfigured,
  persistKnownUsersToSheet,
  readKnownUserRowsFromSheet,
} from "@/lib/google-sheets-service";
export type AuthProvider = "google" | "credentials";

export interface KnownUserRecord {
  email: string;
  name: string | null;
  provider: AuthProvider;
  firstSeenAt: string;
  lastSeenAt: string;
}

export type KnownUsersFile = Record<string, KnownUserRecord>;

export function isKnownUsersPersistenceConfigured(): boolean {
  return isServiceAccountConfigured();
}

function readSeedKnownUsersFromRepo(): KnownUsersFile {
  const seedPath = path.join(process.cwd(), "content", "known-users.json");
  if (!fs.existsSync(seedPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(seedPath, "utf8")) as KnownUsersFile;
  } catch {
    return {};
  }
}

function sanitizeProvider(value: string): AuthProvider {
  return value === "credentials" ? "credentials" : "google";
}

function sheetRowsToKnownUsers(rows: Awaited<ReturnType<typeof readKnownUserRowsFromSheet>>): KnownUsersFile {
  const users: KnownUsersFile = {};
  for (const row of rows) {
    users[row.email] = {
      email: row.email,
      name: row.name ?? null,
      provider: sanitizeProvider(row.provider),
      firstSeenAt: row.firstSeenAt,
      lastSeenAt: row.lastSeenAt,
    };
  }
  return users;
}

function mergeKnownUserRecords(existing: KnownUserRecord, incoming: KnownUserRecord): KnownUserRecord {
  return {
    email: incoming.email,
    name: incoming.name || existing.name,
    provider: incoming.provider || existing.provider,
    firstSeenAt:
      existing.firstSeenAt <= incoming.firstSeenAt ? existing.firstSeenAt : incoming.firstSeenAt,
    lastSeenAt:
      existing.lastSeenAt >= incoming.lastSeenAt ? existing.lastSeenAt : incoming.lastSeenAt,
  };
}

export function mergeKnownUsersFiles(...sources: KnownUsersFile[]): KnownUsersFile {
  const merged: KnownUsersFile = {};
  for (const source of sources) {
    for (const [email, record] of Object.entries(source)) {
      const normalized = email.toLowerCase().trim();
      if (!normalized) continue;
      merged[normalized] = merged[normalized]
        ? mergeKnownUserRecords(merged[normalized], { ...record, email: normalized })
        : { ...record, email: normalized };
    }
  }
  return merged;
}

export async function loadKnownUsersFromPersistentStore(): Promise<KnownUsersFile | null> {
  if (!isKnownUsersPersistenceConfigured()) return null;

  try {
    let users = sheetRowsToKnownUsers(await readKnownUserRowsFromSheet());

    if (Object.keys(users).length === 0) {
      const seed = readSeedKnownUsersFromRepo();
      if (Object.keys(seed).length > 0) {
        await persistKnownUsersToSheet(seed);
        users = seed;
      }
    }

    return users;
  } catch (error) {
    console.error("Failed to load known users from Google Sheets:", error);
    return null;
  }
}

export async function saveKnownUsersToPersistentStore(users: KnownUsersFile): Promise<boolean> {
  if (!isKnownUsersPersistenceConfigured()) return false;

  try {
    await persistKnownUsersToSheet(users);
    return true;
  } catch (error) {
    console.error("Failed to save known users to Google Sheets:", error);
    return false;
  }
}