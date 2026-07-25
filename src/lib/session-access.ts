import type { AudienceSlug } from "@/lib/content";
import type { UserRole } from "@/types/roles";

const ROLE_AUDIENCE: Partial<Record<UserRole, AudienceSlug>> = {
  student: "students",
  engineer: "engineers",
  professional: "professionals",
};

export function getAudienceForRole(role: UserRole | null | undefined): AudienceSlug | null {
  if (!role) return null;
  return ROLE_AUDIENCE[role] ?? null;
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: UserRole | null | undefined): boolean {
  return role === "super_admin";
}

export function isLearnerRole(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === "student" || role === "engineer" || role === "professional";
}

export function canAccessSessionVideo(
  role: UserRole | null | undefined,
  audience: AudienceSlug
): boolean {
  if (!role) return false;
  if (isAdminRole(role)) return true;
  return ROLE_AUDIENCE[role] === audience;
}

/**
 * Multi-role aware helpers. `session.user.role` (singular) is the role the
 * user is currently *acting as* (via the role switcher) and is what every
 * existing gate above should keep using unchanged. These operate on the full
 * `session.user.roles` set instead, for the few places that must ignore the
 * active-role view and check everything a user actually holds - e.g. whether
 * the role switcher itself should be shown, or whether a super_admin who has
 * switched to "student" view can still reach the admin area to switch back.
 */

export function hasRole(
  roles: UserRole[] | null | undefined,
  role: UserRole
): boolean {
  return Array.isArray(roles) && roles.includes(role);
}

export function hasAnyRole(
  roles: UserRole[] | null | undefined,
  check: UserRole[]
): boolean {
  if (!Array.isArray(roles) || roles.length === 0) return false;
  return check.some((r) => roles.includes(r));
}

/** True if the user holds super_admin among their assigned roles, regardless of active view. */
export function isSuperAdminAnyRole(roles: UserRole[] | null | undefined): boolean {
  return hasRole(roles, "super_admin");
}

/** True if the user holds admin or super_admin among their assigned roles, regardless of active view. */
export function isAdminAnyRole(roles: UserRole[] | null | undefined): boolean {
  return hasAnyRole(roles, ["admin", "super_admin"]);
}

/** Union of every audience this user's assigned roles map to (learner roles only). */
export function getAudiencesForRoles(roles: UserRole[] | null | undefined): AudienceSlug[] {
  if (!Array.isArray(roles)) return [];
  const audiences = new Set<AudienceSlug>();
  for (const role of roles) {
    const audience = ROLE_AUDIENCE[role];
    if (audience) audiences.add(audience);
  }
  return Array.from(audiences);
}