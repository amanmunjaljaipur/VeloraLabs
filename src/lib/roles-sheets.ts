import fs from "fs";
import path from "path";
import {
  isServiceAccountConfigured,
  persistUserRolesToSheet,
  readUserRolesFromSheet,
} from "@/lib/google-sheets-service";
import { buildUserNameMap } from "@/lib/user-directory";
import { USER_ROLES, type UserRole } from "@/types/roles";

export type UserRolesConfig = Record<string, UserRole>;

export function isRolesPersistenceConfigured(): boolean {
  return isServiceAccountConfigured();
}

function readSeedRolesFromRepo(): UserRolesConfig {
  const seedPath = path.join(process.cwd(), "content", "user-roles.json");
  if (!fs.existsSync(seedPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(seedPath, "utf8")) as UserRolesConfig;
  } catch {
    return {};
  }
}

function sanitizeRoles(raw: Record<string, string>): UserRolesConfig {
  const valid = new Set<string>(USER_ROLES);
  const out: UserRolesConfig = {};
  for (const [email, role] of Object.entries(raw)) {
    const normalized = email.toLowerCase().trim();
    if (normalized && valid.has(role)) {
      out[normalized] = role as UserRole;
    }
  }
  return out;
}

export async function loadRolesFromPersistentStore(): Promise<UserRolesConfig | null> {
  if (!isRolesPersistenceConfigured()) return null;

  try {
    let roles = sanitizeRoles(await readUserRolesFromSheet());

    if (Object.keys(roles).length === 0) {
      const seed = sanitizeRoles(readSeedRolesFromRepo());
      if (Object.keys(seed).length > 0) {
        await persistUserRolesToSheet(seed, {
          names: buildUserNameMap(),
          updatedBy: "seed",
        });
        roles = seed;
      }
    }

    return roles;
  } catch (error) {
    console.error("Failed to load roles from Google Sheets:", error);
    return null;
  }
}

export async function saveRolesToPersistentStore(
  roles: UserRolesConfig,
  meta?: { updatedBy?: string; names?: Record<string, string> }
): Promise<boolean> {
  if (!isRolesPersistenceConfigured()) return false;

  try {
    await persistUserRolesToSheet(sanitizeRoles(roles), {
      ...meta,
      names: { ...buildUserNameMap(), ...meta?.names },
    });
    return true;
  } catch (error) {
    console.error("Failed to save roles to Google Sheets:", error);
    return false;
  }
}