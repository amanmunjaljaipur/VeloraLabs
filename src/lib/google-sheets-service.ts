import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getFreeSession } from "@/lib/content";
import { readJsonFile, writeJsonFile } from "@/lib/data-store";

const SHEETS_CONFIG_FILE = "sheets-config.json";
const SPREADSHEET_TITLE = "Verlin Labs Submissions";

export const TAB_FREE_SESSION = "Free Session";
const TAB_SESSION_DETAILS = "Free Session Details";
export const TAB_CONTACT = "Contact Us";
export const TAB_NEWSLETTER = "Newsletter Subscribers";
export const TAB_USER_ROLES = "User Roles";
export const TAB_KNOWN_USERS = "Known Users";
export const TAB_MANUAL_USERS = "Manual Users";
export const TAB_NEWS_UPDATES = "News Updates";
export const TAB_NEWSLETTER_EDITIONS = "Newsletter Editions";
export const TAB_NEWSLETTER_DRAFT = "Newsletter Draft";

const HEADERS: Record<string, string[]> = {
  [TAB_FREE_SESSION]: [
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
  [TAB_CONTACT]: ["Timestamp", "Name", "Email", "Message", "Source"],
  [TAB_NEWSLETTER]: ["Timestamp", "Email", "Source"],
  [TAB_USER_ROLES]: ["Email", "Name", "Role", "Updated At", "Updated By"],
  [TAB_KNOWN_USERS]: ["Email", "Name", "Provider", "First Seen At", "Last Seen At"],
  [TAB_MANUAL_USERS]: [
    "ID",
    "Email",
    "Password Hash",
    "First Name",
    "Last Name",
    "Name",
    "Created At",
  ],
  [TAB_NEWS_UPDATES]: [
    "ID",
    "Submitted At",
    "Title",
    "Summary",
    "URL",
    "Source",
    "Category",
    "Week Of",
    "Status",
  ],
  [TAB_NEWSLETTER_EDITIONS]: [
    "Edition ID",
    "Week Of",
    "Title",
    "Published At",
    "Item Count",
    "Intro",
    "Slug",
    "Markdown",
    "HTML",
  ],
  [TAB_NEWSLETTER_DRAFT]: [
    "Draft ID",
    "Updated At",
    "Title",
    "Intro",
    "Status",
    "Story Count",
    "Stories JSON",
    "HTML",
    "Markdown",
  ],
};

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

interface SheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl?: string;
}

function normalizeServiceAccount(parsed: ServiceAccount): ServiceAccount | null {
  if (!parsed.client_email || !parsed.private_key) return null;
  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key.includes("\\n")
      ? parsed.private_key.replace(/\\n/g, "\n")
      : parsed.private_key,
  };
}

function parseServiceAccountJson(raw: string): ServiceAccount | null {
  const trimmed = raw.trim();
  for (const candidate of [trimmed, trimmed.replace(/\r\n/g, "\n")]) {
    try {
      const parsed = normalizeServiceAccount(JSON.parse(candidate) as ServiceAccount);
      if (parsed) return parsed;
    } catch {
      // try next parse strategy
    }
  }
  return null;
}

function parseServiceAccount(): ServiceAccount | null {
  const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

  if (!onVercel) {
    const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
    if (keyFile) {
      const resolved = path.isAbsolute(keyFile) ? keyFile : path.join(process.cwd(), keyFile);
      if (fs.existsSync(resolved)) {
        try {
          const parsed = normalizeServiceAccount(
            JSON.parse(fs.readFileSync(resolved, "utf8")) as ServiceAccount
          );
          if (parsed) return parsed;
        } catch {
          return null;
        }
      }
    }
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  return parseServiceAccountJson(raw);
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

async function ensureFormSheetTabs(token: string, spreadsheetId: string): Promise<void> {
  for (const [tab, headers] of Object.entries(HEADERS)) {
    await ensureSheetTab(token, spreadsheetId, tab, headers);
  }
}

async function ensureSpreadsheet(token: string): Promise<string> {
  let spreadsheetId = getStoredSpreadsheetId();

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
  } else {
    await ensureFormSheetTabs(token, spreadsheetId);
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
        await appendRow(token, spreadsheetId, TAB_FREE_SESSION, bookingRow(payload));
        break;
      case "contact":
        await appendRow(token, spreadsheetId, TAB_CONTACT, [
          new Date().toISOString(),
          payload.name || "",
          payload.email || "",
          payload.message || "",
          payload.source || "Website",
        ]);
        break;
      case "newsletter":
        await appendRow(token, spreadsheetId, TAB_NEWSLETTER, [
          new Date().toISOString(),
          payload.email || "",
          payload.source || "Website",
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

async function getSheetTitles(token: string, spreadsheetId: string): Promise<string[]> {
  const res = await googleFetch(
    token,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`
  );
  if (!res.ok) {
    throw new Error(`Failed to read spreadsheet metadata: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    sheets?: { properties?: { title?: string } }[];
  };
  return (data.sheets ?? [])
    .map((sheet) => sheet.properties?.title)
    .filter((title): title is string => Boolean(title));
}

async function ensureSheetTab(
  token: string,
  spreadsheetId: string,
  tab: string,
  headers: string[]
): Promise<void> {
  const titles = await getSheetTitles(token, spreadsheetId);
  if (!titles.includes(tab)) {
    const res = await googleFetch(
      token,
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: tab } } }],
        }),
      }
    );
    if (!res.ok) {
      throw new Error(`Failed to add sheet tab "${tab}": ${await res.text()}`);
    }
  }
  await writeHeaderRow(token, spreadsheetId, tab, headers);
}

async function ensureUserRolesTab(token: string, spreadsheetId: string): Promise<void> {
  await ensureSheetTab(token, spreadsheetId, TAB_USER_ROLES, HEADERS[TAB_USER_ROLES]);
}

async function ensureKnownUsersTab(token: string, spreadsheetId: string): Promise<void> {
  await ensureSheetTab(token, spreadsheetId, TAB_KNOWN_USERS, HEADERS[TAB_KNOWN_USERS]);
}

async function ensureManualUsersTab(token: string, spreadsheetId: string): Promise<void> {
  await ensureSheetTab(token, spreadsheetId, TAB_MANUAL_USERS, HEADERS[TAB_MANUAL_USERS]);
}

async function ensureNewsletterDraftTab(token: string, spreadsheetId: string): Promise<void> {
  await ensureSheetTab(token, spreadsheetId, TAB_NEWSLETTER_DRAFT, HEADERS[TAB_NEWSLETTER_DRAFT]);
}

async function ensureAdminTabs(token: string, spreadsheetId: string): Promise<void> {
  await ensureUserRolesTab(token, spreadsheetId);
  await ensureKnownUsersTab(token, spreadsheetId);
  await ensureManualUsersTab(token, spreadsheetId);
  await ensureNewsletterDraftTab(token, spreadsheetId);
}

async function withSpreadsheetAccess(): Promise<{
  token: string;
  spreadsheetId: string;
} | null> {
  const account = parseServiceAccount();
  if (!account) return null;
  const token = await getAccessToken(account);
  const spreadsheetId = await ensureSpreadsheet(token);
  await ensureAdminTabs(token, spreadsheetId);
  return { token, spreadsheetId };
}

export interface KnownUserSheetRow {
  email: string;
  name?: string;
  provider: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export async function readKnownUserRowsFromSheet(): Promise<KnownUserSheetRow[]> {
  const access = await withSpreadsheetAccess();
  if (!access) return [];

  const range = `'${TAB_KNOWN_USERS}'!A2:E`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to read known users: ${await res.text()}`);
  }

  const data = (await res.json()) as { values?: string[][] };
  const rows: KnownUserSheetRow[] = [];

  for (const row of data.values ?? []) {
    const email = row[0]?.toLowerCase().trim();
    const provider = row[2]?.trim();
    const firstSeenAt = row[3]?.trim();
    const lastSeenAt = row[4]?.trim();
    if (!email || !provider || !firstSeenAt || !lastSeenAt) continue;

    rows.push({
      email,
      name: row[1]?.trim() || undefined,
      provider,
      firstSeenAt,
      lastSeenAt,
    });
  }

  return rows;
}

export interface ManualUserSheetRow {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  name: string;
  createdAt: string;
}

export async function readManualUserRowsFromSheet(): Promise<ManualUserSheetRow[]> {
  const access = await withSpreadsheetAccess();
  if (!access) return [];

  await ensureManualUsersTab(access.token, access.spreadsheetId);

  const range = `'${TAB_MANUAL_USERS}'!A2:G`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to read manual users: ${await res.text()}`);
  }

  const data = (await res.json()) as { values?: string[][] };
  const rows: ManualUserSheetRow[] = [];

  for (const row of data.values ?? []) {
    const id = row[0]?.trim();
    const email = row[1]?.toLowerCase().trim();
    const passwordHash = row[2]?.trim();
    const firstName = row[3]?.trim();
    const lastName = row[4]?.trim();
    const name = row[5]?.trim();
    const createdAt = row[6]?.trim();
    if (!id || !email || !passwordHash || !firstName || !lastName || !name || !createdAt) {
      continue;
    }

    rows.push({
      id,
      email,
      passwordHash,
      firstName,
      lastName,
      name,
      createdAt,
    });
  }

  return rows;
}

export async function appendManualUserToSheet(user: ManualUserSheetRow): Promise<boolean> {
  const access = await withSpreadsheetAccess();
  if (!access) return false;

  await ensureManualUsersTab(access.token, access.spreadsheetId);

  const existing = await readManualUserRowsFromSheet();
  if (existing.some((row) => row.email === user.email)) {
    return true;
  }

  await appendRow(access.token, access.spreadsheetId, TAB_MANUAL_USERS, [
    user.id,
    user.email,
    user.passwordHash,
    user.firstName,
    user.lastName,
    user.name,
    user.createdAt,
  ]);
  return true;
}

export async function persistKnownUsersToSheet(
  users: Record<
    string,
    {
      email: string;
      name: string | null;
      provider: string;
      firstSeenAt: string;
      lastSeenAt: string;
    }
  >
): Promise<void> {
  const access = await withSpreadsheetAccess();
  if (!access) {
    throw new Error("Google Sheets service account is not configured");
  }

  const entries = Object.values(users).sort((a, b) => a.email.localeCompare(b.email));

  if (entries.length === 0) {
    const clearRes = await googleFetch(
      access.token,
      `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(`'${TAB_KNOWN_USERS}'!A2:E`)}:clear`,
      { method: "POST", body: JSON.stringify({}) }
    );
    if (!clearRes.ok) {
      throw new Error(`Failed to clear known users: ${await clearRes.text()}`);
    }
    return;
  }

  const rows = entries.map((user) => [
    user.email,
    user.name ?? "",
    user.provider,
    user.firstSeenAt,
    user.lastSeenAt,
  ]);

  const range = `'${TAB_KNOWN_USERS}'!A2:E${rows.length + 1}`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to write known users: ${await res.text()}`);
  }
}

export interface UserRoleSheetRow {
  email: string;
  name?: string;
  role: string;
}

export async function readUserRolesFromSheet(): Promise<Record<string, string>> {
  const rows = await readUserRoleRowsFromSheet();
  const roles: Record<string, string> = {};
  for (const row of rows) {
    roles[row.email] = row.role;
  }
  return roles;
}

export async function readUserRoleRowsFromSheet(): Promise<UserRoleSheetRow[]> {
  const access = await withSpreadsheetAccess();
  if (!access) return [];

  const range = `'${TAB_USER_ROLES}'!A2:E`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to read user roles: ${await res.text()}`);
  }

  const data = (await res.json()) as { values?: string[][] };
  const rows: UserRoleSheetRow[] = [];

  for (const row of data.values ?? []) {
    const email = row[0]?.toLowerCase().trim();
    if (!email) continue;

    const hasNameColumn = row.length >= 3 && row[2]?.trim();
    const name = hasNameColumn ? row[1]?.trim() : "";
    const role = (hasNameColumn ? row[2] : row[1])?.trim();

    if (role) {
      rows.push({ email, name: name || undefined, role });
    }
  }

  return rows;
}

export async function persistUserRolesToSheet(
  roles: Record<string, string>,
  meta?: { updatedBy?: string; names?: Record<string, string> }
): Promise<void> {
  const access = await withSpreadsheetAccess();
  if (!access) {
    throw new Error("Google Sheets service account is not configured");
  }

  if (Object.keys(roles).length === 0) {
    const clearRes = await googleFetch(
      access.token,
      `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(`'${TAB_USER_ROLES}'!A2:E`)}:clear`,
      { method: "POST", body: JSON.stringify({}) }
    );
    if (!clearRes.ok) {
      throw new Error(`Failed to clear user roles: ${await clearRes.text()}`);
    }
    return;
  }

  const now = new Date().toISOString();
  const updatedBy = meta?.updatedBy ?? "system";
  const rows = Object.entries(roles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([email, role]) => [
      email,
      meta?.names?.[email] ?? "",
      role,
      now,
      updatedBy,
    ]);

  const range = `'${TAB_USER_ROLES}'!A2:E${rows.length + 1}`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to write user roles: ${await res.text()}`);
  }
}

export interface NewsUpdateSheetRow {
  id: string;
  submittedAt: string;
  title: string;
  summary: string;
  url?: string;
  source?: string;
  category?: string;
  weekOf: string;
  status: string;
}

export interface NewsletterEditionSheetRow {
  editionId: string;
  weekOf: string;
  title: string;
  publishedAt: string;
  itemCount: number;
  intro: string;
  slug: string;
  markdown: string;
  html: string;
}

export async function appendNewsUpdateToSheet(row: NewsUpdateSheetRow): Promise<void> {
  const access = await withSpreadsheetAccess();
  if (!access) {
    throw new Error("Google Sheets service account is not configured");
  }

  await appendRow(access.token, access.spreadsheetId, TAB_NEWS_UPDATES, [
    row.id,
    row.submittedAt,
    row.title,
    row.summary,
    row.url ?? "",
    row.source ?? "",
    row.category ?? "",
    row.weekOf,
    row.status,
  ]);
}

export async function readNewsUpdatesFromSheet(): Promise<NewsUpdateSheetRow[]> {
  const access = await withSpreadsheetAccess();
  if (!access) return [];

  const range = `'${TAB_NEWS_UPDATES}'!A2:I`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to read news updates: ${await res.text()}`);
  }

  const data = (await res.json()) as { values?: string[][] };
  const rows: NewsUpdateSheetRow[] = [];

  for (const row of data.values ?? []) {
    const id = row[0]?.trim();
    const title = row[2]?.trim();
    if (!id || !title) continue;

    rows.push({
      id,
      submittedAt: row[1]?.trim() ?? "",
      title,
      summary: row[3]?.trim() ?? "",
      url: row[4]?.trim() || undefined,
      source: row[5]?.trim() || undefined,
      category: row[6]?.trim() || undefined,
      weekOf: row[7]?.trim() ?? "",
      status: row[8]?.trim() || "pending",
    });
  }

  return rows;
}

export async function persistNewsUpdatesToSheet(rows: NewsUpdateSheetRow[]): Promise<void> {
  const access = await withSpreadsheetAccess();
  if (!access) {
    throw new Error("Google Sheets service account is not configured");
  }

  const values = rows
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .map((row) => [
      row.id,
      row.submittedAt,
      row.title,
      row.summary,
      row.url ?? "",
      row.source ?? "",
      row.category ?? "",
      row.weekOf,
      row.status,
    ]);

  if (values.length === 0) {
    const clearRes = await googleFetch(
      access.token,
      `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(`'${TAB_NEWS_UPDATES}'!A2:I`)}:clear`,
      { method: "POST", body: JSON.stringify({}) }
    );
    if (!clearRes.ok) {
      throw new Error(`Failed to clear news updates: ${await clearRes.text()}`);
    }
    return;
  }

  const range = `'${TAB_NEWS_UPDATES}'!A2:I${values.length + 1}`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to write news updates: ${await res.text()}`);
  }
}

export async function appendNewsletterEditionToSheet(
  edition: NewsletterEditionSheetRow
): Promise<void> {
  const access = await withSpreadsheetAccess();
  if (!access) {
    throw new Error("Google Sheets service account is not configured");
  }

  await appendRow(access.token, access.spreadsheetId, TAB_NEWSLETTER_EDITIONS, [
    edition.editionId,
    edition.weekOf,
    edition.title,
    edition.publishedAt,
    String(edition.itemCount),
    edition.intro,
    edition.slug,
    edition.markdown,
    edition.html,
  ]);
}

export async function readNewsletterEditionsFromSheet(): Promise<NewsletterEditionSheetRow[]> {
  const access = await withSpreadsheetAccess();
  if (!access) return [];

  const range = `'${TAB_NEWSLETTER_EDITIONS}'!A2:I`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to read newsletter editions: ${await res.text()}`);
  }

  const data = (await res.json()) as { values?: string[][] };
  const rows: NewsletterEditionSheetRow[] = [];

  for (const row of data.values ?? []) {
    const editionId = row[0]?.trim();
    const weekOf = row[1]?.trim();
    if (!editionId || !weekOf) continue;

    rows.push({
      editionId,
      weekOf,
      title: row[2]?.trim() ?? "",
      publishedAt: row[3]?.trim() ?? "",
      itemCount: Number(row[4] ?? 0),
      intro: row[5]?.trim() ?? "",
      slug: row[6]?.trim() ?? "",
      markdown: row[7]?.trim() ?? "",
      html: row[8]?.trim() ?? "",
    });
  }

  return rows;
}

export interface NewsletterSubscriberSheetRow {
  email: string;
  source: string;
  subscribedAt: string;
}

export async function readNewsletterSubscriberRowsFromSheet(): Promise<
  NewsletterSubscriberSheetRow[]
> {
  const access = await withSpreadsheetAccess();
  if (!access) return [];

  await ensureSheetTab(access.token, access.spreadsheetId, TAB_NEWSLETTER, HEADERS[TAB_NEWSLETTER]);

  const range = `'${TAB_NEWSLETTER}'!A2:C`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to read newsletter subscribers: ${await res.text()}`);
  }

  const data = (await res.json()) as { values?: string[][] };
  const rows: NewsletterSubscriberSheetRow[] = [];

  for (const row of data.values ?? []) {
    const email = row[1]?.trim().toLowerCase();
    if (!email) continue;
    rows.push({
      subscribedAt: row[0]?.trim() ?? new Date().toISOString(),
      email,
      source: row[2]?.trim() || "Website",
    });
  }

  return rows;
}

export async function appendNewsletterSubscriberToSheet(
  email: string,
  source: string
): Promise<boolean> {
  const access = await withSpreadsheetAccess();
  if (!access) return false;

  await ensureSheetTab(access.token, access.spreadsheetId, TAB_NEWSLETTER, HEADERS[TAB_NEWSLETTER]);

  const normalized = email.toLowerCase().trim();
  const existing = await readNewsletterSubscriberRowsFromSheet();
  if (existing.some((row) => row.email === normalized)) {
    return true;
  }

  await appendRow(access.token, access.spreadsheetId, TAB_NEWSLETTER, [
    new Date().toISOString(),
    normalized,
    source,
  ]);
  return true;
}

export async function persistNewsletterDraftToSheet(
  draft: {
    id: string;
    updatedAt: string;
    title: string;
    intro: string;
    status: string;
    stories: unknown[];
    html: string;
    markdown: string;
  } | null
): Promise<void> {
  const access = await withSpreadsheetAccess();
  if (!access) {
    throw new Error("Google Sheets service account is not configured");
  }

  if (!draft) {
    const clearRes = await googleFetch(
      access.token,
      `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(`'${TAB_NEWSLETTER_DRAFT}'!A2:I`)}:clear`,
      { method: "POST", body: JSON.stringify({}) }
    );
    if (!clearRes.ok) {
      throw new Error(`Failed to clear newsletter draft: ${await clearRes.text()}`);
    }
    return;
  }

  const range = `'${TAB_NEWSLETTER_DRAFT}'!A2:I2`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({
        values: [
          [
            draft.id,
            draft.updatedAt,
            draft.title,
            draft.intro,
            draft.status,
            String(draft.stories.length),
            JSON.stringify(draft.stories),
            draft.html,
            draft.markdown,
          ],
        ],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to write newsletter draft: ${await res.text()}`);
  }
}

export async function readNewsletterDraftFromSheet(): Promise<{
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  intro: string;
  stories: import("@/lib/newsletter-rich-compile").NewsletterStory[];
  html: string;
  markdown: string;
  status: "draft" | "sent";
} | null> {
  const access = await withSpreadsheetAccess();
  if (!access) return null;

  const range = `'${TAB_NEWSLETTER_DRAFT}'!A2:I2`;
  const res = await googleFetch(
    access.token,
    `https://sheets.googleapis.com/v4/spreadsheets/${access.spreadsheetId}/values/${encodeURIComponent(range)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to read newsletter draft: ${await res.text()}`);
  }

  const data = (await res.json()) as { values?: string[][] };
  const row = data.values?.[0];
  if (!row?.[0]) return null;

  let stories: import("@/lib/newsletter-rich-compile").NewsletterStory[] = [];
  try {
    stories = JSON.parse(row[6] ?? "[]");
  } catch {
    stories = [];
  }

  return {
    id: row[0],
    createdAt: row[1] ?? new Date().toISOString(),
    updatedAt: row[1] ?? new Date().toISOString(),
    title: row[2] ?? "",
    intro: row[3] ?? "",
    status: row[4] === "sent" ? "sent" : "draft",
    stories,
    html: row[7] ?? "",
    markdown: row[8] ?? "",
  };
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