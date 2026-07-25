import { randomUUID } from "crypto";
import { ensureDataFileHydrated, readJsonFile, writeJsonFileAsync } from "@/lib/data-store";

/**
 * User-cloned voice/avatar profiles ("bring your own voice/face"). Creating
 * one requires the voice_face_clone consent (checked at the API layer via
 * consent-store.ts, not here) and a source media sample. The actual
 * cloning/embedding step is the Voice/Avatar Agents' job (stubbed pending
 * real GPU endpoints) - this store just tracks the profile's lifecycle.
 */

const PROFILES_FILE = "avatar-clone-profiles.json";
const DEFAULT_JSON = "[]";

export type ProfileKind = "voice" | "avatar" | "both";
export type ProfileStatus = "processing" | "ready" | "failed";

export interface CloneProfile {
  id: string;
  email: string;
  name: string;
  kind: ProfileKind;
  status: ProfileStatus;
  sourceMedia: { provider: "blob" | "google_drive"; url: string } | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

async function readAll(): Promise<CloneProfile[]> {
  await ensureDataFileHydrated(PROFILES_FILE, DEFAULT_JSON, { force: true });
  return readJsonFile<CloneProfile[]>(PROFILES_FILE, DEFAULT_JSON);
}
async function writeAll(items: CloneProfile[]): Promise<void> {
  await writeJsonFileAsync(PROFILES_FILE, items, DEFAULT_JSON);
}

export async function listProfilesForUser(email: string): Promise<CloneProfile[]> {
  const all = await readAll();
  return all.filter((p) => p.email === email.toLowerCase());
}

export async function getProfile(id: string, email: string): Promise<CloneProfile | null> {
  const all = await readAll();
  return all.find((p) => p.id === id && p.email === email.toLowerCase()) ?? null;
}

export async function createProfile(input: {
  email: string;
  name: string;
  kind: ProfileKind;
  sourceMedia: { provider: "blob" | "google_drive"; url: string };
}): Promise<CloneProfile> {
  const all = await readAll();
  const now = new Date().toISOString();
  const profile: CloneProfile = {
    id: randomUUID(),
    email: input.email.toLowerCase(),
    name: input.name,
    kind: input.kind,
    status: "processing",
    sourceMedia: input.sourceMedia,
    error: null,
    createdAt: now,
    updatedAt: now,
  };
  all.push(profile);
  await writeAll(all);
  return profile;
}

export async function updateProfile(id: string, patch: Partial<Pick<CloneProfile, "status" | "error">>): Promise<CloneProfile | null> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx]!, ...patch, updatedAt: new Date().toISOString() };
  await writeAll(all);
  return all[idx]!;
}

export async function deleteProfile(id: string, email: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((p) => !(p.id === id && p.email === email.toLowerCase()));
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}
