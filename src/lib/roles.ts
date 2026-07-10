import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";
import { UserRole } from "@/types/roles";

export type UserRolesConfig = Record<string, UserRole>;

const ROLES_FILE = "user-roles.json";
/** Short TTL so role promotions (e.g. → super_admin) show up across instances quickly */
const CACHE_TTL_MS = 15 * 1000;

let cachedRoles: UserRolesConfig | null = null;
let cacheLoadedAt = 0;
let loadPromise: Promise<void> | null = null;

function readLocalRolesFile(): UserRolesConfig {
  return readJsonFile<UserRolesConfig>(ROLES_FILE, "{}");
}

async function writeLocalRolesFile(roles: UserRolesConfig): Promise<void> {
  await writeJsonFileAsync(ROLES_FILE, roles, "{}");
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
    // Always re-pull from Blob on Vercel so role changes are visible on all instances
    await ensureDataFileHydrated(ROLES_FILE, "{}", { force: true });
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
  return roles[email.toLowerCase().trim()] ?? null;
}

/**
 * Fresh role from disk/Blob — use for session/JWT so super_admin promotions apply immediately.
 */
export async function getRoleForEmailFresh(
  email: string | null | undefined
): Promise<UserRole | null> {
  if (!email) return null;
  await ensureRolesLoaded(true);
  return getRoleForEmail(email);
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
  await writeLocalRolesFile(roles);
}

export async function removeUserRole(email: string, _updatedBy?: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  await ensureRolesLoaded(true);

  const roles = { ...getRolesSnapshot() };
  if (!(normalized in roles)) return false;
  delete roles[normalized];

  cachedRoles = roles;
  cacheLoadedAt = Date.now();
  await writeLocalRolesFile(roles);

  return true;
}