import fs from "fs";
import path from "path";
import { buildUserNameMap, readRepoRoleAssignments } from "@/lib/user-directory";
import { getDisplayRoleFrom, type StoredAssignment } from "@/lib/roles";
import type { UserRole } from "@/types/roles";

export interface RoleSheetSeedRow {
  email: string;
  name: string;
  role: UserRole;
}

function readJsonFile<T>(relativePath: string, fallback: T): T {
  const filePath = path.join(process.cwd(), "content", relativePath);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

/** Build role rows from local JSON files (repo seed data). Only ever shows one role per user (the active one) - this predates multi-role. */
export function buildRoleSheetSeedRows(): RoleSheetSeedRow[] {
  const roles = readJsonFile<Record<string, StoredAssignment>>("user-roles.json", {});
  const names = buildUserNameMap();

  return Object.entries(roles)
    .map(([email, raw]) => ({
      email: email.toLowerCase().trim(),
      name: names[email.toLowerCase()] ?? "",
      role: getDisplayRoleFrom(raw),
    }))
    .filter((row): row is RoleSheetSeedRow => row.role !== null)
    .sort((a, b) => a.email.localeCompare(b.email));
}

/** Build role rows from persisted JSON assignments. Only ever shows one role per user (the active one) - this predates multi-role. */
export async function buildRoleSheetSyncRows(): Promise<RoleSheetSeedRow[]> {
  const localRoles = readRepoRoleAssignments();
  const names = buildUserNameMap();

  return Object.entries(localRoles)
    .map(([email, raw]) => ({
      email: email.toLowerCase().trim(),
      name: names[email.toLowerCase()] ?? "",
      role: getDisplayRoleFrom(raw),
    }))
    .filter((row): row is RoleSheetSeedRow => row.role !== null)
    .sort((a, b) => a.email.localeCompare(b.email));
}