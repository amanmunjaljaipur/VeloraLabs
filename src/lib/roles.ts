import fs from "fs";
import path from "path";
import { DEFAULT_ROLE, UserRole } from "@/types/roles";

type UserRolesConfig = Record<string, UserRole>;

const rolesFilePath = path.join(process.cwd(), "content", "user-roles.json");

let cachedRoles: UserRolesConfig | null = null;

function readUserRolesFile(): UserRolesConfig {
  return JSON.parse(fs.readFileSync(rolesFilePath, "utf8")) as UserRolesConfig;
}

function writeUserRolesFile(roles: UserRolesConfig): void {
  fs.writeFileSync(rolesFilePath, `${JSON.stringify(roles, null, 2)}\n`, "utf8");
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