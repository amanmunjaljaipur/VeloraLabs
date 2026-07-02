import fs from "fs";
import path from "path";
import { initGoogleSheet, submitViaServiceAccount } from "../src/lib/google-sheets-service";

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

  console.log("Initializing spreadsheet...");
  const init = await initGoogleSheet();
  if (!init.ok) {
    console.error("Init failed:", init.error);
    process.exit(1);
  }

  console.log("Spreadsheet ID:", init.spreadsheetId);
  console.log("Open:", init.spreadsheetUrl);

  console.log("Appending test booking row...");
  const synced = await submitViaServiceAccount({
    type: "booking",
    name: "Test User",
    email: "test@verlinlabs.example",
    audience: "students",
    audienceLabel: "School Students (Classes 6–12)",
    sessionTitle: "Free 2-Hour Introductory Session",
    sessionDuration: "2 hours",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    timezone: "Asia/Kolkata",
    status: "Test",
    source: "setup-script",
    bookingId: `TEST-${Date.now()}`,
  });

  if (!synced) {
    console.error("Failed to append test row.");
    process.exit(1);
  }

  console.log("Success — check your Google Sheet for the test booking.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});