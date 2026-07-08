import { list, put } from "@vercel/blob";
import { after } from "next/server";
import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");
const BLOB_PREFIX = "verlin-labs/data/";

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

function isBlobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function getRuntimeDir(): string {
  return isVercelRuntime()
    ? path.join("/tmp", "verlin-labs-data")
    : CONTENT_DIR;
}

function blobKey(filename: string): string {
  return `${BLOB_PREFIX}${filename}`;
}

function scheduleBlobPersist(filename: string, content: string): void {
  if (!isBlobEnabled()) return;

  const upload = () =>
    put(blobKey(filename), content, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
    }).catch((error) => {
      console.error(`Failed to persist ${filename} to Vercel Blob:`, error);
    });

  try {
    after(upload);
  } catch {
    void upload();
  }
}

function ensureRuntimeFile(filename: string, defaultContent: string): string {
  const runtimeDir = getRuntimeDir();
  const runtimePath = path.join(runtimeDir, filename);

  if (!fs.existsSync(runtimeDir)) {
    fs.mkdirSync(runtimeDir, { recursive: true });
  }

  if (!fs.existsSync(runtimePath)) {
    const seedPath = path.join(CONTENT_DIR, filename);
    if (fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, runtimePath);
    } else {
      fs.writeFileSync(runtimePath, `${defaultContent}\n`, "utf8");
    }
  }

  return runtimePath;
}

export async function hydrateAllFromBlob(): Promise<void> {
  if (!isBlobEnabled() || !isVercelRuntime()) return;

  try {
    let cursor: string | undefined;

    do {
      const result = await list({ prefix: BLOB_PREFIX, cursor, limit: 1000 });

      for (const blob of result.blobs) {
        const filename = blob.pathname.startsWith(BLOB_PREFIX)
          ? blob.pathname.slice(BLOB_PREFIX.length)
          : blob.pathname;

        if (!filename || filename.includes("..")) continue;

        const response = await fetch(blob.url);
        if (!response.ok) continue;

        const content = await response.text();
        const runtimePath = path.join(getRuntimeDir(), filename);
        const dir = path.dirname(runtimePath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(runtimePath, content, "utf8");
      }

      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);
  } catch (error) {
    console.error("Failed to hydrate runtime data from Vercel Blob:", error);
  }
}

export function readJsonFile<T>(filename: string, defaultContent = "{}"): T {
  const filePath = ensureRuntimeFile(filename, defaultContent);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJsonFile(filename: string, data: unknown, defaultContent = "{}"): void {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  const filePath = ensureRuntimeFile(filename, defaultContent);
  fs.writeFileSync(filePath, content, "utf8");
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // chmod is best-effort (e.g. Windows, /tmp on Vercel)
  }

  if (isVercelRuntime() && isBlobEnabled()) {
    scheduleBlobPersist(filename, content);
  } else if (isVercelRuntime() && !isBlobEnabled()) {
    console.warn(
      `[data-store] BLOB_READ_WRITE_TOKEN is not set — ${filename} will be lost on the next deploy.`
    );
  }
}

export function readTextFile(filename: string, defaultContent = ""): string {
  const filePath = ensureRuntimeFile(filename, defaultContent);
  return fs.readFileSync(filePath, "utf8");
}

export function writeTextFile(filename: string, content: string, defaultContent = ""): void {
  const filePath = ensureRuntimeFile(filename, defaultContent);
  fs.writeFileSync(filePath, content, "utf8");
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // chmod is best-effort
  }

  if (isVercelRuntime() && isBlobEnabled()) {
    scheduleBlobPersist(filename, content);
  } else if (isVercelRuntime() && !isBlobEnabled()) {
    console.warn(
      `[data-store] BLOB_READ_WRITE_TOKEN is not set — ${filename} will be lost on the next deploy.`
    );
  }
}