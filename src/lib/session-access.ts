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