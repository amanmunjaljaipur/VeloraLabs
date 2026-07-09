import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import { UserRole } from "@/types/roles";

export type UserRolesConfig = Record<string, UserRole>;

const ROLES_FILE = "user-roles.json";
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedRoles: UserRolesConfig | null = null;
let cacheLoadedAt = 0;
let loadPromise: Promise<void> | null = null;

function readLocalRolesFile(): UserRolesConfig {
  return readJsonFile<UserRolesConfig>(ROLES_FILE, "{}");
}

function writeLocalRolesFile(roles: UserRolesConfig): void {
  writeJsonFile(ROLES_FILE, roles, "{}");
}

function getRolesSnapshot(): UserRolesConfig {
  return cachedRoles ?? readLocalRolesFile();
}

export function invalidateRolesCache(): void {
  cachedRoles = null;
  cacheLoadedAt = 0;
  loadPromise = null;
}

export async function ensureRolesLoaded(force = false): Promise<void> {
  if (!force && cachedRoles && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return;
  }

  if (loadPromise && !force) {
    await loadPromise;
    return;
  }

  loadPromise = (async () => {
    cachedRoles = readLocalRolesFile();
    cacheLoadedAt = Date.now();
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
}

export function getRoleForEmail(email: string | null | undefined): UserRole | null {
  if (!email) return null;
  const roles = getRolesSnapshot();
  return roles[email.toLowerCase()] ?? null;
}

export function hasCustomRoleAssignment(email: string | null | undefined): boolean {
  if (!email) return false;
  const roles = getRolesSnapshot();
  return email.toLowerCase() in roles;
}

export function getAllUserRoles(): { email: string; role: UserRole }[] {
  const roles = getRolesSnapshot();
  return Object.entries(roles)
    .map(([email, role]) => ({ email, role }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function setUserRole(
  email: string,
  role: UserRole,
  _updatedBy?: string
): Promise<void> {
  const normalized = email.toLowerCase().trim();
  await ensureRolesLoaded(true);

  const roles = { ...getRolesSnapshot() };
  roles[normalized] = role;

  cachedRoles = roles;
  cacheLoadedAt = Date.now();
  writeLocalRolesFile(roles);
}

export async function removeUserRole(email: string, _updatedBy?: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  await ensureRolesLoaded(true);

  const roles = { ...getRolesSnapshot() };
  if (!(normalized in roles)) return false;
  delete roles[normalized];

  cachedRoles = roles;
  cacheLoadedAt = Date.now();
  writeLocalRolesFile(roles);

  return true;
}