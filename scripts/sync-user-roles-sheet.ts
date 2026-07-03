import fs from "fs";
import path from "path";
import { initGoogleSheet, persistUserRolesToSheet } from "../src/lib/google-sheets-service";
import { buildRoleSheetSyncRows } from "../src/lib/role-sheet-seed";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

async function main() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
    console.error("Google service account is not configured.");
    console.error("Run: .\\scripts\\setup-google-sheets.ps1");
    process.exit(1);
  }

  const rows = await buildRoleSheetSyncRows();
  if (rows.length === 0) {
    console.error("No users found in content/user-roles.json");
    process.exit(1);
  }

  console.log("Initializing spreadsheet and User Roles tab...");
  const init = await initGoogleSheet();
  if (!init.ok) {
    console.error("Init failed:", init.error);
    process.exit(1);
  }

  const roles: Record<string, string> = {};
  const names: Record<string, string> = {};
  for (const row of rows) {
    roles[row.email] = row.role;
    if (row.name) names[row.email] = row.name;
  }

  console.log(`Syncing ${rows.length} user(s) to the User Roles sheet...`);
  await persistUserRolesToSheet(roles, { names, updatedBy: "sync-script" });

  console.log("\nUser Roles sheet updated:");
  for (const row of rows) {
    console.log(`  ${row.email} | ${row.name || "(no name)"} | ${row.role}`);
  }

  if (init.spreadsheetUrl) {
    console.log("\nOpen:", init.spreadsheetUrl);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});