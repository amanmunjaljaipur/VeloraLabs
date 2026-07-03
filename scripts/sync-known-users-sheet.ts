import fs from "fs";
import path from "path";
import { initGoogleSheet, persistKnownUsersToSheet } from "../src/lib/google-sheets-service";
import { mergeKnownUsersFiles } from "../src/lib/known-users-sheets";

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
    process.exit(1);
  }

  const knownUsers = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "content", "known-users.json"), "utf8")
  ) as Record<string, unknown>;
  const manualUsers = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "content", "manual-users.json"), "utf8")
  ) as { users: { email: string; name: string; createdAt: string }[] };

  const manualAsKnown = Object.fromEntries(
    manualUsers.users.map((user) => [
      user.email.toLowerCase(),
      {
        email: user.email.toLowerCase(),
        name: user.name,
        provider: "credentials",
        firstSeenAt: user.createdAt,
        lastSeenAt: user.createdAt,
      },
    ])
  );

  const users = mergeKnownUsersFiles(knownUsers as never, manualAsKnown as never);
  if (Object.keys(users).length === 0) {
    console.error("No known users found to sync.");
    process.exit(1);
  }

  const init = await initGoogleSheet();
  if (!init.ok) {
    console.error("Init failed:", init.error);
    process.exit(1);
  }

  await persistKnownUsersToSheet(users);
  console.log(`Synced ${Object.keys(users).length} known user(s) to Google Sheets.`);
  if (init.spreadsheetUrl) console.log("Open:", init.spreadsheetUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});