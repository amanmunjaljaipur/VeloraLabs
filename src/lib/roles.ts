import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";
import { ROLE_HIERARCHY, USER_ROLES, UserRole } from "@/types/roles";

/**
 * A user can hold multiple roles at once (e.g. super_admin + student).
 * `roles` is the full assigned set; `activeRole` is which one they're
 * currently viewing/operating the app as (switchable via the top-nav
 * role switcher). `activeRole` defaults to the highest-privilege role
 * in `roles` until the user explicitly picks one.
 */
export interface RoleAssignment {
  roles: UserRole[];
  activeRole: UserRole | null;
}

/**
 * On-disk shape is tolerant of every format this file has ever used, so old
 * data is never rewritten/reset on deploy - it's just interpreted correctly:
 *  - legacy string:        "admin"                                  (pre multi-role)
 *  - legacy string array:  ["admin", "student"]                     (no active role yet)
 *  - current shape:        { roles: ["admin","student"], activeRole: "student" }
 */
type StoredAssignment = UserRole | UserRole[] | RoleAssignment | undefined | null;
export type UserRolesConfig = Record<string, StoredAssignment>;

const ROLES_FILE = "user-roles.json";
/** Short TTL for warm cache; writers always refresh carefully */
const CACHE_TTL_MS = 5_000;
/** After a local write, prefer in-memory map over re-hydrating stale Blob for a few seconds */
const LOCAL_WRITE_GRACE_MS = 8_000;

/**
 * Permanent platform owners - always super_admin regardless of Blob / user-roles.json drift.
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

function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/** Highest-privilege role in a set, or null if the set is empty. */
function highestOf(roles: UserRole[]): UserRole | null {
  let best: UserRole | null = null;
  let bestIdx = -1;
  for (const r of roles) {
    const idx = ROLE_HIERARCHY.indexOf(r);
    if (idx > bestIdx) {
      bestIdx = idx;
      best = r;
    }
  }
  return best;
}

/** Normalize any on-disk shape (legacy string / legacy array / current object) into RoleAssignment. */
function normalizeAssignment(raw: StoredAssignment): RoleAssignment {
  if (!raw) return { roles: [], activeRole: null };

  if (typeof raw === "string") {
    return isValidRole(raw) ? { roles: [raw], activeRole: raw } : { roles: [], activeRole: null };
  }

  if (Array.isArray(raw)) {
    const roles = raw.filter(isValidRole);
    return { roles, activeRole: highestOf(roles) };
  }

  const roles = Array.isArray(raw.roles) ? raw.roles.filter(isValidRole) : [];
  const activeRole =
    raw.activeRole && roles.includes(raw.activeRole) ? raw.activeRole : highestOf(roles);
  return { roles, activeRole };
}

let cachedRoles: Record<string, RoleAssignment> | null = null;
let cacheLoadedAt = 0;
let loadPromise: Promise<void> | null = null;
let writeChain: Promise<void> = Promise.resolve();
let lastLocalWriteAt = 0;

function readLocalRolesFile(): Record<string, RoleAssignment> {
  try {
    const raw = readJsonFile<UserRolesConfig>(ROLES_FILE, "{}");
    const normalized: Record<string, RoleAssignment> = {};
    for (const [email, value] of Object.entries(raw)) {
      normalized[email] = normalizeAssignment(value);
    }
    return normalized;
  } catch {
    return {};
  }
}

/** Persist in the current object shape - legacy rows get upgraded lazily the moment they're touched. */
async function writeLocalRolesFile(roles: Record<string, RoleAssignment>): Promise<void> {
  await writeJsonFileAsync(ROLES_FILE, roles, "{}");
}

function getRolesSnapshot(): Record<string, RoleAssignment> {
  return cachedRoles ?? readLocalRolesFile();
}

/** Merge hardcoded super admins into a roles map (in-memory) - additive, never removes their other roles. */
function withHardcodedSuperAdmins(
  roles: Record<string, RoleAssignment>
): Record<string, RoleAssignment> {
  const next = { ...roles };
  for (const email of HARDCODED_SUPER_ADMIN_EMAILS) {
    const existing = next[email] ?? { roles: [], activeRole: null };
    const roleSet: UserRole[] = existing.roles.includes("super_admin")
      ? existing.roles
      : [...existing.roles, "super_admin" as const];
    next[email] = {
      roles: roleSet,
      activeRole: existing.activeRole ?? "super_admin",
    };
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
function applyHardcoded(
  roles: Record<string, RoleAssignment>
): Record<string, RoleAssignment> {
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
      console.warn("[roles] hydrate failed - using local/hardcoded roles", e);
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
      console.warn("[roles] read failed - keeping hardcoded-only map", e);
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

/** Full assigned role set (warm cache). Empty array if the user has no assignment. */
export function getRolesForEmail(email: string | null | undefined): UserRole[] {
  if (!email) return [];
  const normalized = normalizeEmail(email);
  if (isHardcodedSuperAdmin(normalized)) {
    const extra = getRolesSnapshot()[normalized]?.roles ?? [];
    return extra.includes("super_admin") ? extra : [...extra, "super_admin"];
  }
  try {
    return getRolesSnapshot()[normalized]?.roles ?? [];
  } catch {
    return [];
  }
}

/**
 * Back-compat singular accessor - returns the role the user is currently
 * *acting as* (their chosen active role, defaulting to their highest-privilege
 * assigned role). Every existing gate in the app (isAdminRole, requireCmsEditor,
 * etc.) keys off this, so switching "view as" genuinely changes what they see.
 */
export function getRoleForEmail(email: string | null | undefined): UserRole | null {
  if (!email) return null;
  const normalized = normalizeEmail(email);
  if (isHardcodedSuperAdmin(normalized)) {
    const assignment = getRolesSnapshot()[normalized];
    if (assignment?.activeRole && assignment.roles.includes(assignment.activeRole)) {
      return assignment.activeRole;
    }
    return "super_admin";
  }
  try {
    const assignment = getRolesSnapshot()[normalized];
    if (!assignment) return null;
    return assignment.activeRole ?? highestOf(assignment.roles);
  } catch {
    return null;
  }
}

/**
 * Fresh roles from Blob/disk - used by session/JWT so promotions apply quickly.
 * Hardcoded super_admin never depends on I/O.
 */
export async function getRolesForEmailFresh(
  email: string | null | undefined
): Promise<UserRole[]> {
  if (!email) return [];
  if (isHardcodedSuperAdmin(email)) {
    void ensureRolesLoaded(false).catch(() => undefined);
    return getRolesForEmail(email);
  }
  try {
    const writingRecently =
      lastLocalWriteAt > 0 && Date.now() - lastLocalWriteAt < LOCAL_WRITE_GRACE_MS;
    await ensureRolesLoaded(!writingRecently);
    let roles = getRolesForEmail(email);
    if (roles.length === 0) {
      lastLocalWriteAt = 0; // allow force hydrate past grace
      await ensureRolesLoaded(true);
      roles = getRolesForEmail(email);
    }
    return roles;
  } catch (e) {
    console.warn("[roles] getRolesForEmailFresh failed", e);
    return getRolesForEmail(email);
  }
}

/** Fresh singular (active-role) lookup - same eventual-consistency handling as getRolesForEmailFresh. */
export async function getRoleForEmailFresh(
  email: string | null | undefined
): Promise<UserRole | null> {
  const roles = await getRolesForEmailFresh(email);
  if (roles.length === 0) return null;
  const normalized = email ? normalizeEmail(email) : "";
  const assignment = getRolesSnapshot()[normalized];
  if (assignment?.activeRole && roles.includes(assignment.activeRole)) {
    return assignment.activeRole;
  }
  return highestOf(roles);
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

/** One row per user for the admin panel - `role` kept as the highest-privilege role for old UI, `roles` is the full set. */
export function getAllUserRoles(): { email: string; role: UserRole; roles: UserRole[]; activeRole: UserRole | null }[] {
  const roles = applyHardcoded(getRolesSnapshot());
  return Object.entries(roles)
    .filter(([, assignment]) => assignment.roles.length > 0)
    .map(([email, assignment]) => ({
      email,
      role: assignment.activeRole ?? (highestOf(assignment.roles) as UserRole),
      roles: assignment.roles,
      activeRole: assignment.activeRole,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

/**
 * Replace a user's full role set and await Blob so other instances see it immediately.
 * Serialized + retry so concurrent assigns do not overwrite each other.
 * If their current active role is no longer in the new set, it's reset to the
 * new highest-privilege role.
 */
export async function setUserRoles(
  email: string,
  roles: UserRole[],
  _updatedBy?: string
): Promise<void> {
  const normalized = normalizeEmail(email);
  let nextRoles = Array.from(new Set(roles.filter(isValidRole)));
  if (isHardcodedSuperAdmin(normalized) && !nextRoles.includes("super_admin")) {
    nextRoles = [...nextRoles, "super_admin"];
  }

  await enqueueRoleWrite(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        lastLocalWriteAt = 0; // allow hydrate to see others' writes
        await ensureRolesLoaded(true);

        const all = applyHardcoded({ ...getRolesSnapshot() });
        const prevActive = all[normalized]?.activeRole ?? null;
        all[normalized] = {
          roles: nextRoles,
          activeRole: prevActive && nextRoles.includes(prevActive) ? prevActive : highestOf(nextRoles),
        };

        cachedRoles = all;
        cacheLoadedAt = Date.now();
        lastLocalWriteAt = Date.now();

        await writeLocalRolesFile(all);

        const verify = applyHardcoded(readLocalRolesFile());
        const verifyRoles = verify[normalized]?.roles ?? [];
        if (
          verifyRoles.length === nextRoles.length &&
          nextRoles.every((r) => verifyRoles.includes(r))
        ) {
          cachedRoles = applyHardcoded({ ...verify });
          cacheLoadedAt = Date.now();
          lastLocalWriteAt = Date.now();
          return;
        }
        lastError = new Error("Role write verify failed");
      } catch (e) {
        lastError = e;
        console.warn(`[roles] setUserRoles attempt ${attempt + 1} failed`, e);
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to save role assignment");
  });
}

/** Deprecated single-role setter, kept for any external caller - just delegates to setUserRoles. */
export async function setUserRole(
  email: string,
  role: UserRole,
  updatedBy?: string
): Promise<void> {
  const current = getRolesForEmail(email);
  const next = current.includes(role) ? current : [...current, role];
  await setUserRoles(email, next, updatedBy);
}

/**
 * Switch which of a user's already-assigned roles they're currently acting as.
 * Refuses to switch to a role they don't hold.
 */
export async function setActiveRole(email: string, role: UserRole): Promise<boolean> {
  const normalized = normalizeEmail(email);

  return enqueueRoleWrite(async () => {
    lastLocalWriteAt = 0;
    await ensureRolesLoaded(true);

    const all = applyHardcoded({ ...getRolesSnapshot() });
    const assignment = all[normalized];
    if (!assignment || !assignment.roles.includes(role)) return false;

    all[normalized] = { roles: assignment.roles, activeRole: role };
    cachedRoles = all;
    cacheLoadedAt = Date.now();
    lastLocalWriteAt = Date.now();
    await writeLocalRolesFile(all);
    return true;
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

/** Remove a single role from a user's set (used by the admin panel's per-role remove control). */
export async function removeUserRoleFromSet(
  email: string,
  role: UserRole,
  _updatedBy?: string
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (isHardcodedSuperAdmin(normalized) && role === "super_admin") {
    return false;
  }

  return enqueueRoleWrite(async () => {
    lastLocalWriteAt = 0;
    await ensureRolesLoaded(true);

    const all = applyHardcoded({ ...getRolesSnapshot() });
    const assignment = all[normalized];
    if (!assignment || !assignment.roles.includes(role)) return false;

    const nextRoles = assignment.roles.filter((r) => r !== role);
    if (nextRoles.length === 0) {
      delete all[normalized];
    } else {
      all[normalized] = {
        roles: nextRoles,
        activeRole: assignment.activeRole === role ? highestOf(nextRoles) : assignment.activeRole,
      };
    }

    cachedRoles = all;
    cacheLoadedAt = Date.now();
    lastLocalWriteAt = Date.now();
    await writeLocalRolesFile(all);
    return true;
  });
}
