import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import { getAllManualUsers } from "@/lib/manual-users";
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

export function recordKnownUser(
  email: string,
  name: string | null | undefined,
  provider: AuthProvider
): KnownUserRecord {
  const normalized = email.toLowerCase().trim();
  const now = new Date().toISOString();
  const data = readKnownUsers();
  const existing = data[normalized];

  const record: KnownUserRecord = {
    email: normalized,
    name: name?.trim() || existing?.name || null,
    provider: existing?.provider ?? provider,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now,
  };

  data[normalized] = record;
  writeKnownUsers(data);
  return record;
}

export function getUsersWithoutRoleAssignment(): UnassignedUser[] {
  const data = readKnownUsers();

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