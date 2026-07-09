import fs from "fs";
import path from "path";
import { buildUserNameMap, readRepoRoleAssignments } from "@/lib/user-directory";
import { USER_ROLES, type UserRole } from "@/types/roles";

export interface RoleSheetSeedRow {
  email: string;
  name: string;
  role: UserRole;
}

const VALID_ROLES = new Set<string>(USER_ROLES);

function readJsonFile<T>(relativePath: string, fallback: T): T {
  const filePath = path.join(process.cwd(), "content", relativePath);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

/** Build role rows from local JSON files (repo seed data). */
export function buildRoleSheetSeedRows(): RoleSheetSeedRow[] {
  const roles = readJsonFile<Record<string, UserRole>>("user-roles.json", {});
  const names = buildUserNameMap();

  return Object.entries(roles)
    .map(([email, role]) => ({
      email: email.toLowerCase().trim(),
      name: names[email.toLowerCase()] ?? "",
      role,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

/** Build role rows from persisted JSON assignments. */
export async function buildRoleSheetSyncRows(): Promise<RoleSheetSeedRow[]> {
  const localRoles = readRepoRoleAssignments();
  const names = buildUserNameMap();

  return Object.entries(localRoles)
    .filter(([, role]) => VALID_ROLES.has(role))
    .map(([email, role]) => ({
      email: email.toLowerCase().trim(),
      name: names[email.toLowerCase()] ?? "",
      role,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}