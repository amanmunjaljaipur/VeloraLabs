import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import { getAllManualUsers, getManualUserByEmail } from "@/lib/manual-users";
import { ensureRolesLoaded, hasCustomRoleAssignment } from "@/lib/roles";

export type AuthProvider = "google" | "credentials";

export interface KnownUserRecord {
  email: string;
  name: string | null;
  provider: AuthProvider;
  firstSeenAt: string;
  lastSeenAt: string;
}

export type KnownUsersFile = Record<string, KnownUserRecord>;

export interface UnassignedUser {
  email: string;
  name: string | null;
  provider: AuthProvider;
  firstSeenAt: string;
  lastSeenAt: string;
}

const KNOWN_USERS_FILE = "known-users.json";
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedKnownUsers: KnownUsersFile | null = null;
let cacheLoadedAt = 0;
let loadPromise: Promise<void> | null = null;

function readLocalKnownUsersFile(): KnownUsersFile {
  return readJsonFile<KnownUsersFile>(KNOWN_USERS_FILE, "{}");
}

function writeLocalKnownUsersFile(data: KnownUsersFile): void {
  writeJsonFile(KNOWN_USERS_FILE, data, "{}");
}

function getKnownUsersSnapshot(): KnownUsersFile {
  return cachedKnownUsers ?? readLocalKnownUsersFile();
}

export function invalidateKnownUsersCache(): void {
  cachedKnownUsers = null;
  cacheLoadedAt = 0;
  loadPromise = null;
}

export async function ensureKnownUsersLoaded(force = false): Promise<void> {
  if (!force && cachedKnownUsers && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return;
  }

  if (loadPromise && !force) {
    await loadPromise;
    return;
  }

  loadPromise = (async () => {
    cachedKnownUsers = readLocalKnownUsersFile();
    cacheLoadedAt = Date.now();
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
}

function inferProvider(email: string, explicit?: AuthProvider): AuthProvider {
  if (explicit) return explicit;
  return getManualUserByEmail(email) ? "credentials" : "google";
}

export async function recordKnownUser(
  email: string,
  name: string | null | undefined,
  provider?: AuthProvider
): Promise<KnownUserRecord> {
  const normalized = email.toLowerCase().trim();
  const now = new Date().toISOString();

  await ensureKnownUsersLoaded(true);

  const data = { ...getKnownUsersSnapshot() };
  const existing = data[normalized];
  const resolvedProvider = provider ?? existing?.provider ?? inferProvider(normalized);

  const record: KnownUserRecord = {
    email: normalized,
    name: name?.trim() || existing?.name || null,
    provider: resolvedProvider,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now,
  };

  data[normalized] = record;
  writeLocalKnownUsersFile(data);

  cachedKnownUsers = data;
  cacheLoadedAt = Date.now();
  return record;
}

/** Adds the user if missing — used to backfill OAuth users on active sessions. */
export async function ensureKnownUser(
  email: string,
  name: string | null | undefined,
  provider?: AuthProvider
): Promise<KnownUserRecord | null> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return null;

  await ensureKnownUsersLoaded();

  const data = getKnownUsersSnapshot();
  if (normalized in data) {
    return data[normalized];
  }

  return recordKnownUser(normalized, name, provider);
}

export async function getKnownUserEmails(): Promise<string[]> {
  await ensureKnownUsersLoaded();
  return Object.values(getKnownUsersSnapshot())
    .map((user) => user.email.toLowerCase().trim())
    .filter(Boolean)
    .sort();
}

export async function getUsersWithoutRoleAssignment(): Promise<UnassignedUser[]> {
  await ensureKnownUsersLoaded();
  await ensureRolesLoaded();

  const data = { ...getKnownUsersSnapshot() };

  try {
    for (const manualUser of getAllManualUsers()) {
      const normalized = manualUser.email.toLowerCase();
      if (!(normalized in data)) {
        data[normalized] = {
          email: normalized,
          name: manualUser.name,
          provider: "credentials",
          firstSeenAt: manualUser.createdAt,
          lastSeenAt: manualUser.createdAt,
        };
      }
    }
  } catch {
    // manual-users may be unavailable on some runtimes
  }

  return Object.values(data)
    .filter((user) => !hasCustomRoleAssignment(user.email))
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
    .map((user) => ({
      email: user.email,
      name: user.name,
      provider: user.provider,
      firstSeenAt: user.firstSeenAt,
      lastSeenAt: user.lastSeenAt,
    }));
}