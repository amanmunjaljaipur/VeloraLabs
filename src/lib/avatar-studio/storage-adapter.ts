import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { getDriveConnection, upsertDriveConnection } from "@/lib/avatar-studio/storage-connections-store";
import { getValidDriveAccessToken, ensureAppFolder, uploadFileToDrive } from "@/lib/avatar-studio/google-drive-client";
import type { JobStorageRef } from "@/lib/avatar-studio/jobs-store";

/**
 * Binary media upload for Avatar Studio (audio/video/portraits).
 *
 * Order:
 * 1. Google Drive if the user connected it
 * 2. Vercel Blob if BLOB_READ_WRITE_TOKEN is set
 * 3. Local disk under .data/avatar-media (dev / no-Blob fallback) served via /api/media/local/...
 *
 * Structured JSON is NOT stored here (Postgres/Blob JSON via data-store).
 */

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

/** Relative path prefix used in /api/media/local/... URLs */
export const LOCAL_MEDIA_URL_PREFIX = "local";

function localMediaRoot(): string {
  return path.join(process.cwd(), ".data", "avatar-media");
}

export function isBlobMediaConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function safeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file.bin";
}

async function uploadToBlob(email: string, filename: string, bytes: Buffer, mimeType: string): Promise<JobStorageRef> {
  if (!isBlobMediaConfigured()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }
  const key = `verlin-labs/avatar-studio/${email.replace(/[^a-z0-9]/gi, "_")}/${randomUUID()}-${safeFilename(filename)}`;
  await put(key, bytes, { access: "private", addRandomSuffix: false, contentType: mimeType });
  return { provider: "blob", url: `${SITE_URL}/api/media/${key}` };
}

/**
 * Local filesystem media for development when Blob is not configured.
 * Survives process restarts on the same machine; not for multi-instance prod.
 */
function uploadToLocalDisk(email: string, filename: string, bytes: Buffer, mimeType: string): JobStorageRef {
  const userDir = email.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "anon";
  const id = randomUUID();
  const safe = safeFilename(filename);
  const rel = path.join(userDir, `${id}-${safe}`);
  const abs = path.join(localMediaRoot(), rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, bytes);
  // Sidecar mime for correct Content-Type on serve
  fs.writeFileSync(`${abs}.meta.json`, JSON.stringify({ mimeType, email, createdAt: new Date().toISOString() }), "utf8");
  const urlPath = rel.split(path.sep).join("/");
  return {
    provider: "blob", // treat as app-hosted for UI; served via /api/media/local/...
    url: `${SITE_URL}/api/media/${LOCAL_MEDIA_URL_PREFIX}/${urlPath}`,
  };
}

export function resolveLocalMediaAbsolutePath(urlPathParts: string[]): string | null {
  // urlPathParts = ["local", "user", "file.mp3"] from /api/media/local/user/file.mp3
  if (urlPathParts[0] !== LOCAL_MEDIA_URL_PREFIX) return null;
  const rest = urlPathParts.slice(1);
  if (rest.length === 0 || rest.some((p) => p === ".." || p.includes(".."))) return null;
  const abs = path.join(localMediaRoot(), ...rest);
  const root = path.resolve(localMediaRoot());
  const resolved = path.resolve(abs);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) return null;
  return resolved;
}

/** Load bytes for a stored media URL (local / relative / absolute). */
export async function downloadMediaBytes(
  url: string
): Promise<{ ok: true; bytes: Buffer; mimeType: string } | { ok: false; error: string }> {
  try {
    // Local app path
    if (url.includes("/api/media/local/")) {
      const after = url.split("/api/media/")[1]?.split("?")[0] ?? "";
      const parts = after.split("/").filter(Boolean);
      const abs = resolveLocalMediaAbsolutePath(parts);
      if (abs && fs.existsSync(abs)) {
        const bytes = fs.readFileSync(abs);
        let mimeType = "application/octet-stream";
        const metaPath = `${abs}.meta.json`;
        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as { mimeType?: string };
            if (meta.mimeType) mimeType = meta.mimeType;
          } catch {
            /* ignore */
          }
        } else if (abs.endsWith(".mp3")) mimeType = "audio/mpeg";
        else if (abs.endsWith(".webm")) mimeType = "audio/webm";
        else if (abs.endsWith(".wav")) mimeType = "audio/wav";
        return { ok: true, bytes, mimeType };
      }
    }

    let fetchUrl = url;
    if (url.startsWith("/")) {
      fetchUrl = `${SITE_URL}${url}`;
    }
    const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) return { ok: false, error: `Download failed ${res.status}` };
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.byteLength < 100) return { ok: false, error: "Empty media" };
    const mimeType = res.headers.get("content-type") || "application/octet-stream";
    return { ok: true, bytes, mimeType };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Download failed" };
  }
}

export async function uploadUserMedia(
  email: string,
  filename: string,
  bytes: Buffer,
  mimeType: string
): Promise<JobStorageRef> {
  const connection = await getDriveConnection(email);
  if (connection) {
    try {
      const { accessToken, refreshed, newExpiresAt } = await getValidDriveAccessToken(connection);
      if (refreshed && newExpiresAt) {
        await upsertDriveConnection({
          email,
          accessToken,
          refreshToken: connection.refreshToken,
          expiresAt: newExpiresAt,
        });
      }

      let folderId = connection.folderId;
      if (!folderId) {
        folderId = await ensureAppFolder(accessToken);
        if (folderId) {
          await upsertDriveConnection({
            email,
            accessToken,
            refreshToken: connection.refreshToken,
            expiresAt: connection.expiresAt,
            folderId,
          });
        }
      }
      if (folderId) {
        const result = await uploadFileToDrive(accessToken, folderId, filename, bytes, mimeType);
        if (result.ok) {
          return {
            provider: "google_drive",
            url: result.webViewLink ?? `https://drive.google.com/file/d/${result.fileId}/view`,
            driveFileId: result.fileId,
          };
        }
        console.error("[avatar-studio/storage] Drive upload failed, falling back:", result.error);
      }
    } catch (error) {
      console.error("[avatar-studio/storage] Drive path errored, falling back:", error);
    }
  }

  // Blob when configured (production / local with token)
  if (isBlobMediaConfigured()) {
    try {
      return await uploadToBlob(email, filename, bytes, mimeType);
    } catch (error) {
      console.error("[avatar-studio/storage] Blob upload failed, trying local disk:", error);
      // fall through to local
    }
  }

  // Local disk fallback (dev without Blob token — fixes "Could not store free voice audio")
  return uploadToLocalDisk(email, filename, bytes, mimeType);
}
