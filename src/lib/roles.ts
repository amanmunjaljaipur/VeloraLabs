import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import {
  isRolesPersistenceConfigured,
  loadRolesFromPersistentStore,
  saveRolesToPersistentStore,
  type UserRolesConfig,
} from "@/lib/roles-sheets";
import { DEFAULT_ROLE, UserRole } from "@/types/roles";

const ROLES_FILE = "user-roles.json";
const CACHE_TTL_MS = 15_000;

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
  if (
    !force &&
    cachedRoles &&
    Date.now() - cacheLoadedAt < CACHE_TTL_MS
  ) {
    return;
  }

  if (loadPromise && !force) {
    await loadPromise;
    return;
  }

  loadPromise = (async () => {
    if (isRolesPersistenceConfigured()) {
      const fromSheets = await loadRolesFromPersistentStore();
      if (fromSheets) {
        cachedRoles = fromSheets;
        cacheLoadedAt = Date.now();
        return;
      }
      console.warn(
        "Google Sheets role load failed — falling back to local file (roles may not persist on Vercel)"
      );
    }

    cachedRoles = readLocalRolesFile();
    cacheLoadedAt = Date.now();
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
}

export function getRoleForEmail(email: string | null | undefined): UserRole {
  if (!email) return DEFAULT_ROLE;
  const roles = getRolesSnapshot();
  return roles[email.toLowerCase()] ?? DEFAULT_ROLE;
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
  updatedBy?: string
): Promise<void> {
  const normalized = email.toLowerCase().trim();
  await ensureRolesLoaded(true);

  const roles = { ...getRolesSnapshot() };
  roles[normalized] = role;

  if (isRolesPersistenceConfigured()) {
    const saved = await saveRolesToPersistentStore(roles, { updatedBy });
    if (!saved) {
      throw new Error("Failed to persist role assignment to Google Sheets");
    }
  } else {
    writeLocalRolesFile(roles);
  }

  cachedRoles = roles;
  cacheLoadedAt = Date.now();
}

export async function removeUserRole(email: string, updatedBy?: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  await ensureRolesLoaded(true);

  const roles = { ...getRolesSnapshot() };
  if (!(normalized in roles)) return false;
  delete roles[normalized];

  if (isRolesPersistenceConfigured()) {
    const saved = await saveRolesToPersistentStore(roles, { updatedBy });
    if (!saved) {
      throw new Error("Failed to persist role removal to Google Sheets");
    }
  } else {
    writeLocalRolesFile(roles);
  }

  cachedRoles = roles;
  cacheLoadedAt = Date.now();
  return true;
}