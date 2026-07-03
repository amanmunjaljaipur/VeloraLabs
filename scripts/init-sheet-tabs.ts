import fs from "fs";
import path from "path";
import { initGoogleSheet } from "../src/lib/google-sheets-service";

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
  const init = await initGoogleSheet();
  if (!init.ok) {
    console.error("Failed:", init.error);
    process.exit(1);
  }
  console.log("Sheet tabs ensured.");
  console.log("Spreadsheet:", init.spreadsheetUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});