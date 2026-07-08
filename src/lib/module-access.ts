import type { AudienceSlug } from "@/lib/content";
import { readJsonFile, writeJsonFile } from "@/lib/data-store";

export type ModuleAccessScope = "full" | "modules";

export interface UserModuleAccessRecord {
  email: string;
  name?: string;
  audience: AudienceSlug;
  scope: ModuleAccessScope;
  allowedDays: number[];
  grantedBy: string;
  grantedAt: string;
  updatedAt: string;
}

type UserModuleAccessConfig = Record<string, UserModuleAccessRecord>;

const ACCESS_FILE = "user-module-access.json";

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function readAccessFile(): UserModuleAccessConfig {
  return readJsonFile<UserModuleAccessConfig>(ACCESS_FILE, "{}");
}

function writeAccessFile(access: UserModuleAccessConfig): void {
  writeJsonFile(ACCESS_FILE, access, "{}");
}

export function getModuleAccessForEmail(
  email: string | null | undefined
): UserModuleAccessRecord | null {
  if (!email) return null;
  const access = readAccessFile();
  return access[normalizeEmail(email)] ?? null;
}

export function getAllModuleAccessGrants(): UserModuleAccessRecord[] {
  const access = readAccessFile();
  return Object.values(access).sort((a, b) => a.email.localeCompare(b.email));
}

export function hasModuleAccessGrant(email: string | null | undefined): boolean {
  return getModuleAccessForEmail(email) !== null;
}

export function setModuleAccessGrant(
  input: {
    email: string;
    name?: string;
    audience: AudienceSlug;
    scope: ModuleAccessScope;
    allowedDays?: number[];
  },
  grantedBy: string
): UserModuleAccessRecord {
  const email = normalizeEmail(input.email);
  const allowedDays =
    input.scope === "full"
      ? []
      : [...new Set((input.allowedDays ?? []).filter((day) => day > 0))].sort((a, b) => a - b);

  if (input.scope === "modules" && allowedDays.length === 0) {
    throw new Error("Select at least one module/day for partial access");
  }

  const access = readAccessFile();
  const existing = access[email];
  const record: UserModuleAccessRecord = {
    email,
    name: input.name?.trim() || existing?.name,
    audience: input.audience,
    scope: input.scope,
    allowedDays,
    grantedBy,
    grantedAt: existing?.grantedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  access[email] = record;
  writeAccessFile(access);
  return record;
}

export function removeModuleAccessGrant(email: string): boolean {
  const normalized = normalizeEmail(email);
  const access = readAccessFile();
  if (!(normalized in access)) return false;
  delete access[normalized];
  writeAccessFile(access);
  return true;
}

export function getAccessibleDaysForUser(
  email: string | null | undefined,
  audience: AudienceSlug
): number[] | "all" | null {
  const grant = getModuleAccessForEmail(email);
  if (!grant || grant.audience !== audience) return null;
  if (grant.scope === "full") return "all";
  return grant.allowedDays;
}