import type { AudienceSlug } from "@/lib/content";
import { hasCustomRoleAssignment } from "@/lib/roles";
import { getAudienceForRole, isLearnerRole } from "@/lib/session-access";
import type { UserRole } from "@/types/roles";

export function isEnrolledLearner(
  email: string | null | undefined,
  role: UserRole | undefined
): boolean {
  if (!email || !role) return false;
  return hasCustomRoleAssignment(email) && isLearnerRole(role);
}

export function getEnrolledLearnerAudience(
  email: string | null | undefined,
  role: UserRole | undefined
): AudienceSlug | null {
  if (!isEnrolledLearner(email, role)) return null;
  return getAudienceForRole(role!);
}