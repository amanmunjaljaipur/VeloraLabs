import fs from "fs";
import path from "path";
import { readJsonFile } from "@/lib/data-store";
import { getAllManualUsers } from "@/lib/manual-users";
import { getDisplayRoleFrom, type UserRolesConfig } from "@/lib/roles";
import { ROLE_LABELS, type UserRole } from "@/types/roles";

const ROLES_FILE = "user-roles.json";

interface KnownUserRecord {
  email: string;
  name: string | null;
}

type KnownUsersFile = Record<string, KnownUserRecord>;

export function readRepoRoleAssignments(): UserRolesConfig {
  const seedPath = path.join(process.cwd(), "content", ROLES_FILE);
  if (!fs.existsSync(seedPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(seedPath, "utf8")) as UserRolesConfig;
  } catch {
    return {};
  }
}

export function buildUserNameMap(): Record<string, string> {
  const names: Record<string, string> = {};

  try {
    const known = readJsonFile<KnownUsersFile>("known-users.json", "{}");
    for (const [email, record] of Object.entries(known)) {
      if (record.name) names[email.toLowerCase()] = record.name;
    }
  } catch {
    // optional on some runtimes
  }

  try {
    for (const user of getAllManualUsers()) {
      names[user.email.toLowerCase()] = user.name;
    }
  } catch {
    // optional
  }

  return names;
}

export function buildUserRoleExportRows(): {
  email: string;
  name: string;
  role: UserRole;
  roleLabel: string;
}[] {
  const roles = readRepoRoleAssignments();
  const names = buildUserNameMap();

  return Object.entries(roles)
    .map(([email, raw]) => ({
      email: email.toLowerCase(),
      name: names[email.toLowerCase()] ?? "",
      role: getDisplayRoleFrom(raw),
    }))
    .filter((row): row is { email: string; name: string; role: UserRole } => row.role !== null)
    .map((row) => ({ ...row, roleLabel: ROLE_LABELS[row.role] }))
    .sort((a, b) => a.email.localeCompare(b.email));
}