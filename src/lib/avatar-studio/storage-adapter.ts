import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { getDriveConnection, upsertDriveConnection } from "@/lib/avatar-studio/storage-connections-store";
import { getValidDriveAccessToken, ensureAppFolder, uploadFileToDrive } from "@/lib/avatar-studio/google-drive-client";
import type { JobStorageRef } from "@/lib/avatar-studio/jobs-store";

/**
 * Single upload entry point for Avatar Studio media (generated videos,
 * voice/avatar source samples). Picks Google Drive if the user has
 * connected it, otherwise falls back to this platform's existing private
 * Vercel Blob + /api/media proxy pattern (already proven to survive
 * deploys everywhere else in this app). Connecting Drive is opt-in - most
 * users will use the Blob path with no setup required.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verlinlabs.com").replace(/\/$/, "");

async function uploadToBlob(email: string, filename: string, bytes: Buffer, mimeType: string): Promise<JobStorageRef> {
  const key = `verlin-labs/avatar-studio/${email.replace(/[^a-z0-9]/gi, "_")}/${randomUUID()}-${filename}`;
  await put(key, bytes, { access: "private", addRandomSuffix: false, contentType: mimeType });
  return { provider: "blob", url: `${SITE_URL}/api/media/${key}` };
}

export async function uploadUserMedia(
  email: string,
  filename: string,
  bytes: Buffer,
  mimeType: string
): Promise<JobStorageRef> {
  const connection = await getDriveConnection(email);
  if (!connection) return uploadToBlob(email, filename, bytes, mimeType);

  try {
    const { accessToken, refreshed, newExpiresAt } = await getValidDriveAccessToken(connection);
    if (refreshed && newExpiresAt) {
      await upsertDriveConnection({ email, accessToken, refreshToken: connection.refreshToken, expiresAt: newExpiresAt });
    }

    let folderId = connection.folderId;
    if (!folderId) {
      folderId = await ensureAppFolder(accessToken);
      if (folderId) await upsertDriveConnection({ email, accessToken, refreshToken: connection.refreshToken, expiresAt: connection.expiresAt, folderId });
    }
    if (!folderId) return uploadToBlob(email, filename, bytes, mimeType);

    const result = await uploadFileToDrive(accessToken, folderId, filename, bytes, mimeType);
    if (!result.ok) {
      console.error("[avatar-studio/storage] Drive upload failed, falling back to Blob:", result.error);
      return uploadToBlob(email, filename, bytes, mimeType);
    }
    return { provider: "google_drive", url: result.webViewLink ?? `https://drive.google.com/file/d/${result.fileId}/view`, driveFileId: result.fileId };
  } catch (error) {
    console.error("[avatar-studio/storage] Drive path errored, falling back to Blob:", error);
    return uploadToBlob(email, filename, bytes, mimeType);
  }
}
