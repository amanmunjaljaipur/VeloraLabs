import type { AudienceSlug } from "@/lib/content";
import { hasModuleAccessGrant } from "@/lib/session-access-grants";
import { getModuleAccessForEmail } from "@/lib/module-access";
import { hasCustomRoleAssignment } from "@/lib/roles";
import { getAudienceForRole, isLearnerRole } from "@/lib/session-access";
import type { UserRole } from "@/types/roles";

export function isEnrolledLearner(
  email: string | null | undefined,
  role: UserRole | null | undefined
): boolean {
  if (!email) return false;
  if (hasModuleAccessGrant(email)) return true;
  if (!role) return false;
  return hasCustomRoleAssignment(email) && isLearnerRole(role);
}

export function getEnrolledLearnerAudience(
  email: string | null | undefined,
  role: UserRole | null | undefined
): AudienceSlug | null {
  if (!email) return null;

  const grant = getModuleAccessForEmail(email);
  if (grant) return grant.audience;

  if (!isEnrolledLearner(email, role)) return null;
  return getAudienceForRole(role!);
}