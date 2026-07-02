import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import { getAllManualUsers, getManualUserByEmail } from "@/lib/manual-users";
import { hasCustomRoleAssignment } from "@/lib/roles";

export type AuthProvider = "google" | "credentials";

export interface KnownUserRecord {
  email: string;
  name: string | null;
  provider: AuthProvider;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface UnassignedUser {
  email: string;
  name: string | null;
  provider: AuthProvider;
  firstSeenAt: string;
  lastSeenAt: string;
}

type KnownUsersFile = Record<string, KnownUserRecord>;

const KNOWN_USERS_FILE = "known-users.json";

function readKnownUsers(): KnownUsersFile {
  return readJsonFile<KnownUsersFile>(KNOWN_USERS_FILE, "{}");
}

function writeKnownUsers(data: KnownUsersFile): void {
  writeJsonFile(KNOWN_USERS_FILE, data, "{}");
}

function inferProvider(email: string, explicit?: AuthProvider): AuthProvider {
  if (explicit) return explicit;
  return getManualUserByEmail(email) ? "credentials" : "google";
}

export function recordKnownUser(
  email: string,
  name: string | null | undefined,
  provider?: AuthProvider
): KnownUserRecord {
  const normalized = email.toLowerCase().trim();
  const now = new Date().toISOString();
  const data = readKnownUsers();
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
  writeKnownUsers(data);
  return record;
}

/** Adds the user if missing — used to backfill OAuth users on active sessions. */
export function ensureKnownUser(
  email: string,
  name: string | null | undefined,
  provider?: AuthProvider
): KnownUserRecord | null {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return null;

  const data = readKnownUsers();
  if (normalized in data) {
    return data[normalized];
  }

  return recordKnownUser(normalized, name, provider);
}

export function getUsersWithoutRoleAssignment(): UnassignedUser[] {
  const data = readKnownUsers();

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