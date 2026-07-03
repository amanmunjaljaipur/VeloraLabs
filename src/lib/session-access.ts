import type { AudienceSlug } from "@/lib/content";
import type { UserRole } from "@/types/roles";

const ROLE_AUDIENCE: Partial<Record<UserRole, AudienceSlug>> = {
  student: "students",
  engineer: "engineers",
  professional: "professionals",
};

export function getAudienceForRole(role: UserRole): AudienceSlug | null {
  return ROLE_AUDIENCE[role] ?? null;
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: UserRole | undefined): boolean {
  return role === "super_admin";
}

export function isLearnerRole(role: UserRole): boolean {
  return role === "student" || role === "engineer" || role === "professional";
}

export function canAccessSessionVideo(role: UserRole, audience: AudienceSlug): boolean {
  if (isAdminRole(role)) return true;
  return ROLE_AUDIENCE[role] === audience;
}