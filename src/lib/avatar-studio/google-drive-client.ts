/**
 * Direct integration with Google Drive (OAuth 2.0 + Drive API v3).
 *
 * Uses the SAME OAuth client as site Google login when possible:
 *   GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET  (NextAuth Google provider)
 * Optional override:
 *   GOOGLE_DRIVE_CLIENT_ID + GOOGLE_DRIVE_CLIENT_SECRET
 *
 * Google Cloud Console (same Web client as login) — required once:
 * 1. Enable **Google Drive API** on that project.
 * 2. OAuth consent screen → add scope:
 *      https://www.googleapis.com/auth/drive.file
 *    (or keep in Testing + add your email as test user).
 * 3. Credentials → that OAuth 2.0 Web client → Authorized redirect URIs:
 *      http://localhost:3000/api/avatar-studio/storage/drive/callback
 *      https://www.verlinlabs.com/api/avatar-studio/storage/drive/callback
 *    (login already has /api/auth/callback/google — Drive needs its own URI.)
 * 4. Env: set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (same as login) in
 *    .env.local and Vercel. No separate Drive keys required.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const FETCH_TIMEOUT_MS = 20_000;
const APP_FOLDER_NAME = "Verlin Labs Avatar Studio";

/** Normalize env values: strip quotes, reject empty / placeholder secrets. */
function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  // Treat common non-secrets as missing (empty quotes, redacted pulls, examples)
  const lower = v.toLowerCase();
  if (
    !v ||
    lower === "[sensitive]" ||
    lower === "your_google_client_id.apps.googleusercontent.com" ||
    lower === "your_google_client_secret" ||
    lower.startsWith("your_") ||
    lower === "undefined" ||
    lower === "null"
  ) {
    return "";
  }
  return v;
}

function driveClientId(): string {
  return cleanEnv(process.env.GOOGLE_DRIVE_CLIENT_ID) || cleanEnv(process.env.GOOGLE_CLIENT_ID);
}
function driveClientSecret(): string {
  return cleanEnv(process.env.GOOGLE_DRIVE_CLIENT_SECRET) || cleanEnv(process.env.GOOGLE_CLIENT_SECRET);
}

function isConfigured(): boolean {
  const id = driveClientId();
  const secret = driveClientSecret();
  // Real Google web client IDs end with .apps.googleusercontent.com
  const idLooksValid = id.includes(".apps.googleusercontent.com") || id.length > 20;
  const secretLooksValid = secret.length >= 10;
  return Boolean(idLooksValid && secretLooksValid);
}

export function isGoogleDriveConfigured(): boolean {
  return isConfigured();
}

/** Safe diagnostics for UI (no secrets). */
export function getGoogleDriveConfigStatus(): {
  configured: boolean;
  credentialSource: "drive_specific" | "login_shared" | "none";
  hasClientId: boolean;
  hasClientSecret: boolean;
  missingEnv: string[];
  /** Redirect URI the user must add on the Google OAuth client */
  redirectUriPath: string;
  driveScope: string;
} {
  const dedicatedId = Boolean(cleanEnv(process.env.GOOGLE_DRIVE_CLIENT_ID));
  const dedicatedSecret = Boolean(cleanEnv(process.env.GOOGLE_DRIVE_CLIENT_SECRET));
  const loginId = Boolean(cleanEnv(process.env.GOOGLE_CLIENT_ID));
  const loginSecret = Boolean(cleanEnv(process.env.GOOGLE_CLIENT_SECRET));
  const hasId = Boolean(driveClientId());
  const hasSecret = Boolean(driveClientSecret());
  const configured = isConfigured();

  let credentialSource: "drive_specific" | "login_shared" | "none" = "none";
  if (dedicatedId && dedicatedSecret) credentialSource = "drive_specific";
  else if (loginId && loginSecret) credentialSource = "login_shared";
  else if (hasId && hasSecret) credentialSource = dedicatedId || dedicatedSecret ? "drive_specific" : "login_shared";

  const missingEnv: string[] = [];
  if (!hasId) missingEnv.push("GOOGLE_CLIENT_ID (or GOOGLE_DRIVE_CLIENT_ID)");
  if (!hasSecret) missingEnv.push("GOOGLE_CLIENT_SECRET (or GOOGLE_DRIVE_CLIENT_SECRET)");
  if (hasId && hasSecret && !configured) {
    missingEnv.push("GOOGLE_CLIENT_ID/SECRET look invalid (need real OAuth Web client values from Google Cloud / Vercel)");
  }

  return {
    configured,
    credentialSource: configured ? credentialSource : "none",
    hasClientId: hasId,
    hasClientSecret: hasSecret,
    missingEnv,
    redirectUriPath: "/api/avatar-studio/storage/drive/callback",
    driveScope: "https://www.googleapis.com/auth/drive.file",
  };
}

export function buildGoogleDriveAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: driveClientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    // drive.file, not full drive scope - least privilege: only files this app creates.
    scope: "https://www.googleapis.com/auth/drive.file",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface TokenResult {
  accessToken: string;
  refreshToken: string | null;
  expiresInSeconds: number;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResult | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: driveClientId(),
        client_secret: driveClientSecret(),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("[avatar-studio/drive] token exchange failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, expiresInSeconds: data.expires_in };
  } catch (error) {
    console.error("[avatar-studio/drive] token exchange errored", error);
    return null;
  }
}

export async function refreshDriveAccessToken(refreshToken: string): Promise<TokenResult | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: driveClientId(),
        client_secret: driveClientSecret(),
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; expires_in: number };
    // Google does not re-issue a refresh_token on refresh - the caller must keep the original.
    return { accessToken: data.access_token, refreshToken: null, expiresInSeconds: data.expires_in };
  } catch (error) {
    console.error("[avatar-studio/drive] token refresh errored", error);
    return null;
  }
}

/** Given a connection record, returns an access token guaranteed valid for at least another minute - refreshes first if needed. Caller is responsible for persisting the refreshed token. */
export async function getValidDriveAccessToken(connection: {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}): Promise<{ accessToken: string; refreshed: boolean; newExpiresAt: string | null }> {
  const stillValid = new Date(connection.expiresAt).getTime() - Date.now() > 60_000;
  if (stillValid) return { accessToken: connection.accessToken, refreshed: false, newExpiresAt: null };

  const refreshed = await refreshDriveAccessToken(connection.refreshToken);
  if (!refreshed) return { accessToken: connection.accessToken, refreshed: false, newExpiresAt: null };

  return {
    accessToken: refreshed.accessToken,
    refreshed: true,
    newExpiresAt: new Date(Date.now() + refreshed.expiresInSeconds * 1000).toISOString(),
  };
}

/** Finds the app's dedicated folder in the user's Drive, creating it on first use. */
export async function ensureAppFolder(accessToken: string): Promise<string | null> {
  try {
    const searchRes = await fetch(
      `${DRIVE_API_BASE}/files?q=${encodeURIComponent(
        `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
      )}&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    );
    const searchData = await searchRes.json().catch(() => null);
    const existingId = searchData?.files?.[0]?.id;
    if (existingId) return existingId;

    const createRes = await fetch(`${DRIVE_API_BASE}/files?fields=id`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: APP_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const createData = await createRes.json().catch(() => null);
    return createData?.id ?? null;
  } catch (error) {
    console.error("[avatar-studio/drive] ensureAppFolder errored", error);
    return null;
  }
}

/** Uploads bytes into the app's folder via multipart upload - fine for the video/audio sizes this platform produces (not chunked/resumable, which would only matter for very large files). */
export async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  filename: string,
  bytes: Buffer,
  mimeType: string
): Promise<{ ok: true; fileId: string; webViewLink: string | null } | { ok: false; error: string }> {
  try {
    const boundary = "verlinlabs-avatar-studio-boundary";
    const metadata = JSON.stringify({ name: filename, parents: [folderId] });
    const multipartBody = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
      ),
      bytes,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,webViewLink`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: multipartBody as BodyInit,
      signal: AbortSignal.timeout(60_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.id) {
      console.error("[avatar-studio/drive] upload failed", res.status, data);
      return { ok: false, error: data?.error?.message ?? "Google Drive rejected the upload" };
    }
    return { ok: true, fileId: data.id, webViewLink: data.webViewLink ?? null };
  } catch (error) {
    console.error("[avatar-studio/drive] upload errored", error);
    return { ok: false, error: "Upload to Google Drive failed" };
  }
}

export async function getDriveUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}
