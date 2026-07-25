import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * Per-user Google Drive connection. Optional storage backend for large
 * generated media (videos, source voice/avatar samples) so a user's own
 * Drive quota absorbs that growth instead of the platform's shared Blob
 * storage - the durability/space concern raised directly by the user.
 * Default behavior with no connection is unchanged: everything still goes
 * to Vercel Blob, which already survives deploys. Connecting Drive is
 * additive, never required to use Avatar Studio.
 */

const CONNECTIONS_FILE = "avatar-storage-connections.json";
const DEFAULT_JSON = "[]";

export interface DriveConnection {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  /** The "Verlin Labs Avatar Studio" folder created in the user's Drive on first connect - reused on every subsequent upload. */
  folderId: string | null;
  connectedAt: string;
}

async function readAll(): Promise<DriveConnection[]> {
  await ensureDataFileHydrated(CONNECTIONS_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<DriveConnection[]>(CONNECTIONS_FILE, DEFAULT_JSON);
}
async function writeAll(items: DriveConnection[]): Promise<void> {
  await writeJsonFileAsync(CONNECTIONS_FILE, items, DEFAULT_JSON);
}

export async function getDriveConnection(email: string): Promise<DriveConnection | null> {
  const all = await readAll();
  return all.find((c) => c.email === email.toLowerCase()) ?? null;
}

export async function upsertDriveConnection(input: {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  folderId?: string | null;
}): Promise<DriveConnection> {
  const normalizedEmail = input.email.toLowerCase();
  const all = await readAll();
  const idx = all.findIndex((c) => c.email === normalizedEmail);
  const record: DriveConnection = {
    email: normalizedEmail,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken || (idx >= 0 ? all[idx]!.refreshToken : ""),
    expiresAt: input.expiresAt,
    folderId: input.folderId !== undefined ? input.folderId : idx >= 0 ? all[idx]!.folderId : null,
    connectedAt: idx >= 0 ? all[idx]!.connectedAt : new Date().toISOString(),
  };
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  await writeAll(all);
  return record;
}

export async function disconnectDrive(email: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((c) => c.email !== email.toLowerCase());
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}
