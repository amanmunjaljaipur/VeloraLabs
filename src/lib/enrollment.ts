import { hasCustomRoleAssignment } from "@/lib/roles";
import { isLearnerRole } from "@/lib/session-access";
import type { UserRole } from "@/types/roles";

export function isEnrolledLearner(
  email: string | null | undefined,
  role: UserRole | undefined
): boolean {
  if (!email || !role) return false;
  return hasCustomRoleAssignment(email) && isLearnerRole(role);
}