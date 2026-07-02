import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getFreeSession } from "@/lib/content";
import { readJsonFile, writeJsonFile } from "@/lib/data-store";

const SHEETS_CONFIG_FILE = "sheets-config.json";
const SPREADSHEET_TITLE = "Verlin Labs Submissions";

const TAB_BOOKINGS = "Free Session Bookings";
const TAB_SESSION_DETAILS = "Free Session Details";
const TAB_CONTACT = "Contact Inquiries";
const TAB_NEWSLETTER = "Newsletter Signups";

const HEADERS: Record<string, string[]> = {
  [TAB_BOOKINGS]: [
    "Timestamp",
    "Booking ID",
    "Status",
    "Name",
    "Email",
    "Audience",
    "Audience Label",
    "Session Title",
    "Session Duration",
    "Date",
    "Time",
    "Timezone",
    "Source",
  ],
  [TAB_CONTACT]: ["Timestamp", "Name", "Email", "Message"],
  [TAB_NEWSLETTER]: ["Timestamp", "Email"],
};

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

interface SheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl?: string;
}

function parseServiceAccount(): ServiceAccount | null {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (keyFile) {
    const resolved = path.isAbsolute(keyFile) ? keyFile : path.join(process.cwd(), keyFile);
    if (fs.existsSync(resolved)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(resolved, "utf8")) as ServiceAccount;
        if (parsed.client_email && parsed.private_key) return parsed;
      } catch {
        return null;
      }
    }
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

async function getAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope:
        "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );
  const unsigned = `${header}.${claim}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), account.private_key);
  const jwt = `${unsigned}.${signature.toString("base64url")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token error: ${err}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function googleFetch(
  token: string,
  url: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

function getStoredSpreadsheetId(): string | null {
  const fromEnv = process.env.GOOGLE_SPREADSHEET_ID;
  if (fromEnv) return fromEnv;
  try {
    const config = readJsonFile<SheetsConfig>(SHEETS_CONFIG_FILE, '{"spreadsheetId":""}');
    return config.spreadsheetId || null;
  } catch {
    return null;
  }
}

function storeSpreadsheetId(id: string, url: string): void {
  writeJsonFile(SHEETS_CONFIG_FILE, { spreadsheetId: id, spreadsheetUrl: url });
}

async function shareWithUser(token: string, spreadsheetId: string): Promise<void> {
  const email = process.env.GOOGLE_SHEETS_SHARE_EMAIL;
  if (!email) return;

  await googleFetch(
    token,
    `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
    {
      method: "POST",
      body: JSON.stringify({
        type: "user",
        role: "writer",
        emailAddress: email,
      }),
    }
  );
}

async function createSpreadsheet(token: string): Promise<{ id: string; url: string }> {
  const res = await googleFetch(token, "https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    body: JSON.stringify({
      properties: { title: SPREADSHEET_TITLE },
      sheets: Object.keys(HEADERS).map((title) => ({
        properties: { title },
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create spreadsheet: ${await res.text()}`);
  }

  const data = (await res.json()) as { spreadsheetId: string; spreadsheetUrl: string };
  return { id: data.spreadsheetId, url: data.spreadsheetUrl };
}

async function writeHeaderRow(
  token: string,
  spreadsheetId: string,
  tab: string,
  headers: string[]
): Promise<void> {
  const range = `'${tab}'!A1:${columnLetter(headers.length)}1`;
  await googleFetch(
    token,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [headers] }),
    }
  );
}

function columnLetter(count: number): string {
  let letter = "";
  let n = count;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

async function appendRow(
  token: string,
  spreadsheetId: string,
  tab: string,
  row: string[]
): Promise<void> {
  const range = `'${tab}'!A:Z`;
  const res = await googleFetch(
    token,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to append row: ${await res.text()}`);
  }
}

async function writeSessionDetailsTab(token: string, spreadsheetId: string): Promise<void> {
  const session = getFreeSession();
  const rows: string[][] = [
    ["Free Session — Reference", ""],
    ["Headline", session.headline],
    ["Description", session.description],
    [],
    ["Benefits", ""],
    ["Title", "Description"],
  ];

  for (const benefit of session.benefits) {
    rows.push([benefit.title, benefit.description]);
  }

  rows.push([], ["Agenda", "", "", ""], ["Time", "Duration", "Title", "Description"]);
  for (const item of session.agenda) {
    rows.push([item.time, item.duration || "", item.title, item.description]);
  }

  rows.push([], ["FAQ", "", ""], ["Category", "Question", "Answer"]);
  for (const category of session.faqCategories) {
    for (const item of category.items) {
      const answer = [item.answer, ...(item.bullets || [])].filter(Boolean).join("\n\n");
      rows.push([category.title, item.question, answer]);
    }
  }

  const range = `'${TAB_SESSION_DETAILS}'!A1:C${rows.length}`;
  const res = await googleFetch(
    token,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to write session details: ${await res.text()}`);
  }
}

async function ensureSpreadsheet(token: string): Promise<string> {
  let spreadsheetId = getStoredSpreadsheetId();
  const isNew = !spreadsheetId;

  if (!spreadsheetId) {
    const created = await createSpreadsheet(token);
    spreadsheetId = created.id;
    storeSpreadsheetId(created.id, created.url);
    console.info(`Created Google Sheet: ${created.url}`);
    await shareWithUser(token, spreadsheetId);

    for (const [tab, headers] of Object.entries(HEADERS)) {
      await writeHeaderRow(token, spreadsheetId, tab, headers);
    }
    await writeSessionDetailsTab(token, spreadsheetId);
  }

  return spreadsheetId;
}

function bookingRow(payload: Record<string, string | undefined>): string[] {
  const timestamp = new Date().toISOString();
  return [
    timestamp,
    payload.bookingId || "",
    payload.status || "Confirmed",
    payload.name || "",
    payload.email || "",
    payload.audience || "",
    payload.audienceLabel || payload.audience || "",
    payload.sessionTitle || "Free 2-Hour Introductory Session",
    payload.sessionDuration || "2 hours",
    payload.date || "",
    payload.time || "",
    payload.timezone || "",
    payload.source || "Website",
  ];
}

export function isServiceAccountConfigured(): boolean {
  return parseServiceAccount() !== null;
}

export async function submitViaServiceAccount(
  payload: Record<string, string | undefined>
): Promise<boolean> {
  const account = parseServiceAccount();
  if (!account) return false;

  try {
    const token = await getAccessToken(account);
    const spreadsheetId = await ensureSpreadsheet(token);

    switch (payload.type) {
      case "booking":
        await appendRow(token, spreadsheetId, TAB_BOOKINGS, bookingRow(payload));
        break;
      case "contact":
        await appendRow(token, spreadsheetId, TAB_CONTACT, [
          new Date().toISOString(),
          payload.name || "",
          payload.email || "",
          payload.message || "",
        ]);
        break;
      case "newsletter":
        await appendRow(token, spreadsheetId, TAB_NEWSLETTER, [
          new Date().toISOString(),
          payload.email || "",
        ]);
        break;
      default:
        return false;
    }

    return true;
  } catch (err) {
    console.error("Google Sheets API error:", err);
    return false;
  }
}

export async function initGoogleSheet(): Promise<{
  ok: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}> {
  const account = parseServiceAccount();
  if (!account) {
    return { ok: false, error: "GOOGLE_SERVICE_ACCOUNT_JSON is not configured" };
  }

  try {
    const token = await getAccessToken(account);
    const spreadsheetId = await ensureSpreadsheet(token);
    const config = readJsonFile<SheetsConfig>(SHEETS_CONFIG_FILE, "{}");
    return {
      ok: true,
      spreadsheetId,
      spreadsheetUrl:
        config.spreadsheetUrl ||
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}