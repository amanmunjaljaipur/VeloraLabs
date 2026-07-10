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

/**
 * Permanent platform owners — always super_admin regardless of Blob / user-roles.json drift.
 * (Both spellings kept so login never loses owner access.)
 */
export const HARDCODED_SUPER_ADMIN_EMAILS: readonly string[] = [
  "amanmunjal.jaipur@gmail.com",
  "amaanmunjal.jaipur@gmail.com",
  "aman@gmail.com",
];

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function isHardcodedSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const n = normalizeEmail(email);
  return HARDCODED_SUPER_ADMIN_EMAILS.some((e) => e === n);
}

let cachedRoles: UserRolesConfig | null = null;
let cacheLoadedAt = 0;
let loadPromise: Promise<void> | null = null;
/** Avoid writing Blob on every request when seed already applied */
let superAdminSeededAt = 0;
const SEED_COOLDOWN_MS = 60_000;

function readLocalRolesFile(): UserRolesConfig {
  return readJsonFile<UserRolesConfig>(ROLES_FILE, "{}");
}

async function writeLocalRolesFile(roles: UserRolesConfig): Promise<void> {
  await writeJsonFileAsync(ROLES_FILE, roles, "{}");
}

function getRolesSnapshot(): UserRolesConfig {
  return cachedRoles ?? readLocalRolesFile();
}

/** Merge hardcoded super admins into a roles map (in-memory). */
function withHardcodedSuperAdmins(roles: UserRolesConfig): UserRolesConfig {
  const next = { ...roles };
  for (const email of HARDCODED_SUPER_ADMIN_EMAILS) {
    next[email] = "super_admin";
  }
  return next;
}

export function invalidateRolesCache(): void {
  cachedRoles = null;
  cacheLoadedAt = 0;
  loadPromise = null;
}

/**
 * Ensure hardcoded owners exist in user-roles.json / Blob so admin lists show them.
 */
async function ensureHardcodedSuperAdminsPersisted(): Promise<void> {
  if (Date.now() - superAdminSeededAt < SEED_COOLDOWN_MS) return;

  const roles = { ...getRolesSnapshot() };
  let dirty = false;
  for (const email of HARDCODED_SUPER_ADMIN_EMAILS) {
    if (roles[email] !== "super_admin") {
      roles[email] = "super_admin";
      dirty = true;
    }
  }
  if (!dirty) {
    superAdminSeededAt = Date.now();
    return;
  }

  cachedRoles = roles;
  cacheLoadedAt = Date.now();
  superAdminSeededAt = Date.now();
  try {
    await writeLocalRolesFile(roles);
  } catch (e) {
    console.warn("[roles] failed to persist hardcoded super_admin seed", e);
  }
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
    cachedRoles = withHardcodedSuperAdmins(readLocalRolesFile());
    cacheLoadedAt = Date.now();
    // Re-seed Blob if owner role was wiped
    await ensureHardcodedSuperAdminsPersisted();
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
}

export function getRoleForEmail(email: string | null | undefined): UserRole | null {
  if (!email) return null;
  const normalized = normalizeEmail(email);
  // Hardcoded owners always win (even if Blob says student / missing)
  if (isHardcodedSuperAdmin(normalized)) {
    return "super_admin";
  }
  const roles = getRolesSnapshot();
  return roles[normalized] ?? null;
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
  const roles = withHardcodedSuperAdmins(getRolesSnapshot());
  return Object.entries(roles)
    .map(([email, role]) => ({ email, role }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function setUserRole(
  email: string,
  role: UserRole,
  _updatedBy?: string
): Promise<void> {
  const normalized = normalizeEmail(email);
  await ensureRolesLoaded(true);

  // Never demote hardcoded platform owners
  if (isHardcodedSuperAdmin(normalized) && role !== "super_admin") {
    role = "super_admin";
  }

  const roles = { ...getRolesSnapshot() };
  roles[normalized] = role;
  // Keep all hardcoded owners present
  for (const e of HARDCODED_SUPER_ADMIN_EMAILS) {
    roles[e] = "super_admin";
  }

  cachedRoles = roles;
  cacheLoadedAt = Date.now();
  await writeLocalRolesFile(roles);
}

export async function removeUserRole(email: string, _updatedBy?: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  await ensureRolesLoaded(true);

  // Hardcoded super admins cannot be removed
  if (isHardcodedSuperAdmin(normalized)) {
    return false;
  }

  const roles = { ...getRolesSnapshot() };
  if (!(normalized in roles)) return false;
  delete roles[normalized];
  for (const e of HARDCODED_SUPER_ADMIN_EMAILS) {
    roles[e] = "super_admin";
  }

  cachedRoles = roles;
  cacheLoadedAt = Date.now();
  await writeLocalRolesFile(roles);

  return true;
}