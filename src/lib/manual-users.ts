import { PASSWORD_MAX_LENGTH } from "@/lib/auth-validation";
import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import {
  appendManualUserToSheet,
  isServiceAccountConfigured,
  readManualUserRowsFromSheet,
  updateManualUserPasswordHashInSheet,
} from "@/lib/google-sheets-service";
import bcrypt from "bcryptjs";

export interface ManualUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  name: string;
  createdAt: string;
}

interface ManualUsersFile {
  users: ManualUser[];
}

const MANUAL_USERS_FILE = "manual-users.json";
const DEFAULT_CONTENT = '{"users":[]}';
const SALT_ROUNDS = 12;
const CACHE_TTL_MS = 15_000;

/** Precomputed hash used to reduce timing leaks when the email is unknown. */
const DUMMY_PASSWORD_HASH =
  "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

let cachedUsers: ManualUser[] | null = null;
let cacheLoadedAt = 0;
let loadPromise: Promise<void> | null = null;

function readLocalUsers(): ManualUsersFile {
  return readJsonFile<ManualUsersFile>(MANUAL_USERS_FILE, DEFAULT_CONTENT);
}

function writeLocalUsers(data: ManualUsersFile): void {
  writeJsonFile(MANUAL_USERS_FILE, data, DEFAULT_CONTENT);
}

function mergeUsers(local: ManualUser[], remote: ManualUser[]): ManualUser[] {
  const byEmail = new Map<string, ManualUser>();
  for (const user of remote) {
    byEmail.set(user.email, user);
  }
  for (const user of local) {
    byEmail.set(user.email, user);
  }
  return Array.from(byEmail.values());
}

function sheetRowsToUsers(rows: Awaited<ReturnType<typeof readManualUserRowsFromSheet>>): ManualUser[] {
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    firstName: row.firstName,
    lastName: row.lastName,
    name: row.name,
    createdAt: row.createdAt,
  }));
}

export async function ensureManualUsersLoaded(force = false): Promise<void> {
  if (!force && cachedUsers && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return;
  }

  if (loadPromise && !force) {
    await loadPromise;
    return;
  }

  loadPromise = (async () => {
    const local = readLocalUsers().users;
    let remote: ManualUser[] = [];

    if (isServiceAccountConfigured()) {
      try {
        remote = sheetRowsToUsers(await readManualUserRowsFromSheet());
      } catch (error) {
        console.error("Failed to load manual users from Sheets:", error);
      }
    }

    cachedUsers = mergeUsers(local, remote);
    cacheLoadedAt = Date.now();
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
}

function getCachedUsers(): ManualUser[] {
  return cachedUsers ?? readLocalUsers().users;
}

export function getAllManualUsers(): ManualUser[] {
  return getCachedUsers();
}

export function getManualUserByEmail(email: string): ManualUser | null {
  const normalized = email.toLowerCase().trim();
  return getCachedUsers().find((user) => user.email === normalized) ?? null;
}

export async function createManualUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<ManualUser> {
  if (input.password.length > PASSWORD_MAX_LENGTH) {
    throw new Error("invalid_password");
  }

  await ensureManualUsersLoaded(true);

  const normalized = input.email.toLowerCase().trim();
  const data = readLocalUsers();

  if (
    data.users.some((user) => user.email === normalized) ||
    getCachedUsers().some((user) => user.email === normalized)
  ) {
    throw new Error("email_exists");
  }

  const user: ManualUser = {
    id: crypto.randomUUID(),
    email: normalized,
    passwordHash: await bcrypt.hash(input.password, SALT_ROUNDS),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    name: `${input.firstName.trim()} ${input.lastName.trim()}`,
    createdAt: new Date().toISOString(),
  };

  data.users.push(user);
  writeLocalUsers(data);
  cachedUsers = mergeUsers(data.users, getCachedUsers());
  cacheLoadedAt = Date.now();

  if (isServiceAccountConfigured()) {
    try {
      await appendManualUserToSheet(user);
    } catch (error) {
      console.error("Failed to persist manual user to Sheets:", error);
    }
  }

  return user;
}

export async function verifyManualUserPassword(
  email: string,
  password: string
): Promise<ManualUser | null> {
  if (password.length > PASSWORD_MAX_LENGTH) {
    return null;
  }

  await ensureManualUsersLoaded();

  const user = getManualUserByEmail(email);
  const hashToCompare = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const valid = await bcrypt.compare(password, hashToCompare);

  if (!user || !valid) {
    return null;
  }

  return user;
}

export async function updateManualUserPassword(
  email: string,
  newPassword: string
): Promise<boolean> {
  if (newPassword.length > PASSWORD_MAX_LENGTH) {
    return false;
  }

  await ensureManualUsersLoaded(true);

  const normalized = email.toLowerCase().trim();
  const cachedUser = getManualUserByEmail(normalized);
  if (!cachedUser) {
    return false;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const data = readLocalUsers();
  const localIndex = data.users.findIndex((user) => user.email === normalized);

  if (localIndex >= 0) {
    data.users[localIndex] = { ...data.users[localIndex]!, passwordHash };
  } else {
    data.users.push({ ...cachedUser, passwordHash });
  }

  writeLocalUsers(data);
  cachedUsers = mergeUsers(data.users, getCachedUsers()).map((user) =>
    user.email === normalized ? { ...user, passwordHash } : user
  );
  cacheLoadedAt = Date.now();

  if (isServiceAccountConfigured()) {
    try {
      await updateManualUserPasswordHashInSheet(normalized, passwordHash);
    } catch (error) {
      console.error("Failed to persist password update to Sheets:", error);
    }
  }

  return true;
}