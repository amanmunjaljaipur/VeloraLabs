import type { AudienceSlug, CoursePhase } from "@/lib/content";
import {
  getAccessibleDaysForUser,
  getModuleAccessForEmail,
  hasModuleAccessGrant,
} from "@/lib/module-access";
import { parseSessionId } from "@/lib/session-videos";
import type { UserRole } from "@/types/roles";
import { canAccessSessionVideo, isAdminRole } from "@/lib/session-access";

export function canAccessSessionDay(
  email: string | null | undefined,
  role: UserRole | null | undefined,
  audience: AudienceSlug,
  day: number
): boolean {
  if (isAdminRole(role)) return true;

  const grant = getModuleAccessForEmail(email);
  if (grant && grant.audience === audience) {
    if (grant.scope === "full") return true;
    return grant.allowedDays.includes(day);
  }

  return canAccessSessionVideo(role, audience);
}

export function canAccessSession(
  email: string | null | undefined,
  role: UserRole | null | undefined,
  sessionId: string
): boolean {
  if (isAdminRole(role)) return true;

  const parsed = parseSessionId(sessionId);
  if (!parsed) return false;

  return canAccessSessionDay(email, role, parsed.audience, parsed.day);
}

export function canAccessAudienceTrack(
  email: string | null | undefined,
  role: UserRole | null | undefined,
  audience: AudienceSlug
): boolean {
  if (isAdminRole(role)) return true;

  const grant = getModuleAccessForEmail(email);
  if (grant && grant.audience === audience) return true;

  return canAccessSessionVideo(role, audience);
}

export function getAccessibleSessionDays(
  email: string | null | undefined,
  role: UserRole | null | undefined,
  audience: AudienceSlug
): number[] | "all" {
  if (isAdminRole(role)) return "all";

  const grantDays = getAccessibleDaysForUser(email, audience);
  if (grantDays) return grantDays;

  if (canAccessSessionVideo(role, audience)) return "all";

  return [];
}

export function filterCoursePhasesByAccessibleDays(
  phases: CoursePhase[],
  accessibleDays: number[] | "all"
): CoursePhase[] {
  if (accessibleDays === "all") return phases;

  const allowed = new Set(accessibleDays);
  return phases
    .map((phase) => ({
      ...phase,
      days: phase.days.filter((day) => allowed.has(day.day)),
    }))
    .filter((phase) => phase.days.length > 0);
}

export { hasModuleAccessGrant };