import fs from "fs";
import path from "path";
import { readUserRoleRowsFromSheet } from "@/lib/google-sheets-service";
import { buildUserNameMap, readRepoRoleAssignments } from "@/lib/user-directory";
import { USER_ROLES, type UserRole } from "@/types/roles";

export interface RoleSheetSeedRow {
  email: string;
  name: string;
  role: UserRole;
}

const VALID_ROLES = new Set<string>(USER_ROLES);

function sanitizeRole(role: string): UserRole | null {
  const normalized = role.trim();
  return VALID_ROLES.has(normalized) ? (normalized as UserRole) : null;
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

/** Merge sheet assignments with local repo data and refresh names. */
export async function buildRoleSheetSyncRows(): Promise<RoleSheetSeedRow[]> {
  const localRoles = readRepoRoleAssignments();
  const names = buildUserNameMap();
  const sheetNames: Record<string, string> = {};

  let sheetRows: Awaited<ReturnType<typeof readUserRoleRowsFromSheet>> = [];
  try {
    sheetRows = await readUserRoleRowsFromSheet();
  } catch {
    // fall back to local seed when sheet is unavailable
  }

  const mergedRoles: Record<string, UserRole> = {};

  for (const [email, role] of Object.entries(localRoles)) {
    const normalized = email.toLowerCase().trim();
    if (normalized) mergedRoles[normalized] = role;
  }

  for (const row of sheetRows) {
    const role = sanitizeRole(row.role);
    if (!role) continue;
    mergedRoles[row.email] = role;
    if (row.name) sheetNames[row.email] = row.name;
  }

  return Object.entries(mergedRoles)
    .map(([email, role]) => ({
      email,
      name: names[email] ?? sheetNames[email] ?? "",
      role,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}