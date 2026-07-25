/**
 * Direct integration with Google Drive (OAuth 2.0 + Drive API v3) so a user
 * can optionally store their generated videos and source samples in their
 * OWN Drive rather than the platform's shared Blob storage. Uses the
 * `drive.file` scope deliberately - the app can only see/manage files it
 * itself creates, not the user's whole Drive - the correct least-privilege
 * choice for an OAuth grant like this.
 *
 * Setup required in Google Cloud Console (outside this codebase):
 * 1. Create a project, enable the Google Drive API.
 * 2. Configure an OAuth consent screen (External, or Internal if using
 *    Google Workspace).
 * 3. Create an OAuth 2.0 Client ID (Web application).
 * 4. Add an authorized redirect URI:
 *    https://www.verlinlabs.com/api/avatar-studio/storage/drive/callback
 * 5. Set GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET in the
 *    environment.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const FETCH_TIMEOUT_MS = 20_000;
const APP_FOLDER_NAME = "Verlin Labs Avatar Studio";

function isConfigured(): boolean {
  return Boolean(process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET);
}

export function isGoogleDriveConfigured(): boolean {
  return isConfigured();
}

export function buildGoogleDriveAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID ?? "",
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
        client_id: process.env.GOOGLE_DRIVE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET as string,
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
        client_id: process.env.GOOGLE_DRIVE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET as string,
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
