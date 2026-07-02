import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import { DEFAULT_ROLE, UserRole } from "@/types/roles";

type UserRolesConfig = Record<string, UserRole>;

const ROLES_FILE = "user-roles.json";

let cachedRoles: UserRolesConfig | null = null;

function readUserRolesFile(): UserRolesConfig {
  return readJsonFile<UserRolesConfig>(ROLES_FILE, "{}");
}

function writeUserRolesFile(roles: UserRolesConfig): void {
  writeJsonFile(ROLES_FILE, roles, "{}");
  cachedRoles = null;
}

function loadUserRoles(): UserRolesConfig {
  if (!cachedRoles) {
    cachedRoles = readUserRolesFile();
  }
  return cachedRoles;
}

export function getRoleForEmail(email: string | null | undefined): UserRole {
  if (!email) return DEFAULT_ROLE;
  const roles = loadUserRoles();
  return roles[email.toLowerCase()] ?? DEFAULT_ROLE;
}

export function hasCustomRoleAssignment(email: string | null | undefined): boolean {
  if (!email) return false;
  const roles = loadUserRoles();
  return email.toLowerCase() in roles;
}

export function getAllUserRoles(): { email: string; role: UserRole }[] {
  const roles = readUserRolesFile();
  return Object.entries(roles)
    .map(([email, role]) => ({ email, role }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

export function setUserRole(email: string, role: UserRole): void {
  const normalized = email.toLowerCase().trim();
  const roles = readUserRolesFile();
  roles[normalized] = role;
  writeUserRolesFile(roles);
}

export function removeUserRole(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  const roles = readUserRolesFile();
  if (!(normalized in roles)) return false;
  delete roles[normalized];
  writeUserRolesFile(roles);
  return true;
}