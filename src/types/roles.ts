export const USER_ROLES = [
  "super_admin",
  "admin",
  "professional",
  "engineer",
  "student",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_ROLE: UserRole = "student";

export const LEARNER_ROLES = ["student", "engineer", "professional"] as const;

export type LearnerRole = (typeof LEARNER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  professional: "Professional",
  engineer: "Engineer",
  student: "Student",
};

/** Higher index = more privileges */
export const ROLE_HIERARCHY: UserRole[] = [
  "student",
  "engineer",
  "professional",
  "admin",
  "super_admin",
];

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
}