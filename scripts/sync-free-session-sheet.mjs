/**
 * Push free-session.json content to the Google Sheets "Free Session Details" tab.
 *
 * Requires in .env.local (or environment):
 *   GOOGLE_SHEETS_WEBHOOK_URL
 *   GOOGLE_SHEETS_WEBHOOK_SECRET
 *
 * Usage: node scripts/sync-free-session-sheet.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
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

const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;

if (!webhookUrl) {
  console.error("GOOGLE_SHEETS_WEBHOOK_URL is not set. Add it to .env.local first.");
  console.error("See scripts/google-sheets/Code.gs for Google Apps Script setup.");
  process.exit(1);
}

const freeSession = JSON.parse(
  fs.readFileSync(path.join(root, "content", "free-session.json"), "utf8")
);

const res = await fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "session_details",
    secret,
    ...freeSession,
  }),
});

const body = await res.json().catch(() => ({}));

if (!res.ok || body.success !== true) {
  console.error("Sync failed:", body.error || res.statusText);
  process.exit(1);
}

console.log("Free session details synced to Google Sheets.");