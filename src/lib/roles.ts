import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";
import { UserRole } from "@/types/roles";

export type UserRolesConfig = Record<string, UserRole>;

const ROLES_FILE = "user-roles.json";
/** Short TTL for warm cache; writers always refresh carefully */
const CACHE_TTL_MS = 5_000;
/** After a local write, prefer in-memory map over re-hydrating stale Blob for a few seconds */
const LOCAL_WRITE_GRACE_MS = 8_000;

/**
 * Permanent platform owners — always super_admin regardless of Blob / user-roles.json drift.
 * Checked BEFORE any file I/O so admin access never depends on Blob.
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
let writeChain: Promise<void> = Promise.resolve();
let lastLocalWriteAt = 0;

function readLocalRolesFile(): UserRolesConfig {
  try {
    return readJsonFile<UserRolesConfig>(ROLES_FILE, "{}");
  } catch {
    return {};
  }
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
 * Serialize role mutations on this instance so concurrent assigns don't clobber each other.
 */
function enqueueRoleWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/**
 * Ensure hardcoded owners exist in the map (in-memory + best-effort Blob).
 */
function applyHardcoded(roles: UserRolesConfig): UserRolesConfig {
  return withHardcodedSuperAdmins(roles);
}

export async function ensureRolesLoaded(force = false): Promise<void> {
  // Warm cache: skip network if recent (unless force)
  if (!force && cachedRoles && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return;
  }

  // After a write on this instance, keep local cache as truth briefly so we don't
  // re-pull a slightly stale Blob and wipe the assignment we just made.
  if (
    force &&
    cachedRoles &&
    lastLocalWriteAt > 0 &&
    Date.now() - lastLocalWriteAt < LOCAL_WRITE_GRACE_MS
  ) {
    cacheLoadedAt = Date.now();
    return;
  }

  if (loadPromise && !force) {
    await loadPromise;
    return;
  }

  // If force and a load is in flight, wait for it then optionally re-run
  if (loadPromise && force) {
    try {
      await loadPromise;
    } catch {
      /* continue */
    }
    // If another writer just finished on this instance, keep that map
    if (
      cachedRoles &&
      lastLocalWriteAt > 0 &&
      Date.now() - lastLocalWriteAt < LOCAL_WRITE_GRACE_MS
    ) {
      cacheLoadedAt = Date.now();
      return;
    }
  }

  loadPromise = (async () => {
    try {
      await ensureDataFileHydrated(ROLES_FILE, "{}", { force: true });
    } catch (e) {
      console.warn("[roles] hydrate failed — using local/hardcoded roles", e);
    }
    try {
      const fromDisk = readLocalRolesFile();
      // Merge: never drop keys we already have in cache from a recent write
      const merged =
        cachedRoles && Date.now() - lastLocalWriteAt < LOCAL_WRITE_GRACE_MS
          ? { ...fromDisk, ...cachedRoles }
          : fromDisk;
      cachedRoles = applyHardcoded(merged);
      cacheLoadedAt = Date.now();
    } catch (e) {
      console.warn("[roles] read failed — keeping hardcoded-only map", e);
      cachedRoles = applyHardcoded(cachedRoles || {});
      cacheLoadedAt = Date.now();
    }
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
  if (isHardcodedSuperAdmin(normalized)) {
    return "super_admin";
  }
  try {
    const roles = getRolesSnapshot();
    return roles[normalized] ?? null;
  } catch {
    return null;
  }
}

/**
 * Fresh role from Blob/disk — used by session/JWT so promotions apply quickly.
 * Hardcoded super_admin never depends on I/O.
 */
export async function getRoleForEmailFresh(
  email: string | null | undefined
): Promise<UserRole | null> {
  if (!email) return null;
  if (isHardcodedSuperAdmin(email)) {
    void ensureRolesLoaded(false).catch(() => undefined);
    return "super_admin";
  }
  try {
    // Force reload so another instance's assign is visible ASAP
    // (grace period only protects the *writing* instance from clobbering itself)
    const writingRecently =
      lastLocalWriteAt > 0 && Date.now() - lastLocalWriteAt < LOCAL_WRITE_GRACE_MS;
    await ensureRolesLoaded(!writingRecently);
    // Extra pull if still missing (eventual consistency)
    let role = getRoleForEmail(email);
    if (!role) {
      lastLocalWriteAt = 0; // allow force hydrate past grace
      await ensureRolesLoaded(true);
      role = getRoleForEmail(email);
    }
    return role;
  } catch (e) {
    console.warn("[roles] getRoleForEmailFresh failed", e);
    return getRoleForEmail(email);
  }
}

export function hasCustomRoleAssignment(email: string | null | undefined): boolean {
  if (!email) return false;
  if (isHardcodedSuperAdmin(email)) return true;
  try {
    const roles = getRolesSnapshot();
    return normalizeEmail(email) in roles;
  } catch {
    return false;
  }
}

export function getAllUserRoles(): { email: string; role: UserRole }[] {
  const roles = applyHardcoded(getRolesSnapshot());
  return Object.entries(roles)
    .map(([email, role]) => ({ email, role }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

/**
 * Assign/update a role and await Blob so other instances see it immediately.
 * Serialized + retry so concurrent assigns do not overwrite each other.
 */
export async function setUserRole(
  email: string,
  role: UserRole,
  _updatedBy?: string
): Promise<void> {
  const normalized = normalizeEmail(email);
  if (isHardcodedSuperAdmin(normalized) && role !== "super_admin") {
    role = "super_admin";
  }

  await enqueueRoleWrite(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Attempt 0: use warm cache if any; later attempts force Blob reload
        lastLocalWriteAt = 0; // allow hydrate to see others' writes
        await ensureRolesLoaded(true);

        const roles = applyHardcoded({ ...getRolesSnapshot() });
        roles[normalized] = role;

        cachedRoles = roles;
        cacheLoadedAt = Date.now();
        lastLocalWriteAt = Date.now();

        // Await Blob put (user-roles is in AWAIT_BLOB_PERSIST_FILES)
        await writeLocalRolesFile(roles);

        // Verify our assignment is still present after write
        const verify = applyHardcoded(readLocalRolesFile());
        if (verify[normalized] === role) {
          cachedRoles = applyHardcoded({ ...verify });
          cacheLoadedAt = Date.now();
          lastLocalWriteAt = Date.now();
          return;
        }
        lastError = new Error("Role write verify failed");
      } catch (e) {
        lastError = e;
        console.warn(`[roles] setUserRole attempt ${attempt + 1} failed`, e);
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to save role assignment");
  });
}

export async function removeUserRole(
  email: string,
  _updatedBy?: string
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (isHardcodedSuperAdmin(normalized)) {
    return false;
  }

  return enqueueRoleWrite(async () => {
    lastLocalWriteAt = 0;
    await ensureRolesLoaded(true);

    const roles = applyHardcoded({ ...getRolesSnapshot() });
    if (!(normalized in roles)) return false;
    delete roles[normalized];

    cachedRoles = roles;
    cacheLoadedAt = Date.now();
    lastLocalWriteAt = Date.now();
    await writeLocalRolesFile(roles);
    return true;
  });
}
