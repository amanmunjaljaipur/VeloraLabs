import { get, list, put } from "@vercel/blob";
import { after } from "next/server";
import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");
const BLOB_PREFIX = "verlin-labs/data/";

/** Runtime data owned by production Blob - never seed from git on Vercel. */
export const RUNTIME_DATA_FILES = new Set([
  "video-progress.json",
  "course-progress.json",
  "session-documents.json",
  "session-videos.json",
  "video-comments.json",
  "legal-acceptances.json",
  "legal-documents.json",
  "newsletter-subscribers.json",
  "newsletter-editions.json",
  "news-updates.json",
  "newsletter-draft.json",
  "user-roles.json",
  "known-users.json",
  "manual-users.json",
  "password-reset-tokens.json",
  "email-verification-challenges.json",
  "user-module-access.json",
  "crm-data.json",
  "page-analytics.json",
  "chatbot-training.json",
  "chatbot-index.json",
  "cms-custom-registry.json",
  "blog-posts.json",
  "app-builder-projects.json",
  "app-builder-tenants.json",
  /** App Builder ops memory (research + experience) - survives deploys, never git-seeded */
  "app-builder-ops-memory.json",
  /** Super Admin agent pause/resume controls */
  "agent-controls.json",
]);

/** Writes that must complete Blob upload before returning (auth / user data). */
const AWAIT_BLOB_PERSIST_FILES = new Set([
  "user-roles.json",
  "known-users.json",
  "manual-users.json",
  "legal-acceptances.json",
  "newsletter-subscribers.json",
  "crm-data.json",
  // Chatbot training must land on Blob before response returns (survives deploys)
  "chatbot-training.json",
  "chatbot-index.json",
  "blog-posts.json",
  "app-builder-projects.json",
  "app-builder-tenants.json",
  "app-builder-ops-memory.json",
  "agent-controls.json",
]);

const hydrationPromises = new Map<string, Promise<boolean>>();

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

async function readBlobContent(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;

  const reader = result.stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(merged);
}

function shouldSeedFromGit(filename: string): boolean {
  if (!isVercelRuntime()) return true;
  return !RUNTIME_DATA_FILES.has(filename);
}

async function persistToBlob(filename: string, content: string): Promise<void> {
  if (!isBlobEnabled()) return;

  await put(blobKey(filename), content, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

function scheduleBlobPersist(filename: string, content: string): void {
  if (!isBlobEnabled()) return;

  const upload = () =>
    persistToBlob(filename, content).catch((error) => {
      console.error(`Failed to persist ${filename} to Vercel Blob:`, error);
    });

  try {
    after(upload);
  } catch {
    void upload();
  }
}

function ensureRuntimeDir(): void {
  const runtimeDir = getRuntimeDir();
  if (!fs.existsSync(runtimeDir)) {
    fs.mkdirSync(runtimeDir, { recursive: true });
  }
}

function getRuntimePath(filename: string): string {
  return path.join(getRuntimeDir(), filename);
}

function ensureRuntimeFile(filename: string, defaultContent: string): string {
  ensureRuntimeDir();
  const runtimePath = getRuntimePath(filename);

  if (!fs.existsSync(runtimePath)) {
    if (shouldSeedFromGit(filename)) {
      const seedPath = path.join(CONTENT_DIR, filename);
      if (fs.existsSync(seedPath)) {
        fs.copyFileSync(seedPath, runtimePath);
      } else {
        fs.writeFileSync(runtimePath, `${defaultContent}\n`, "utf8");
      }
    } else {
      fs.writeFileSync(runtimePath, `${defaultContent}\n`, "utf8");
    }
  }

  return runtimePath;
}

/**
 * Load a runtime data file from Vercel Blob into /tmp.
 * @param force When true, always re-fetch Blob even if a local /tmp file exists.
 *              Required for multi-instance serverless (empty seed must not block Blob).
 */
export async function hydrateFileFromBlob(
  filename: string,
  force = false
): Promise<boolean> {
  if (!isBlobEnabled() || !isVercelRuntime()) return false;

  const runtimePath = getRuntimePath(filename);
  if (!force && fs.existsSync(runtimePath)) return true;

  const cacheKey = force ? `${filename}:force` : filename;
  const existing = hydrationPromises.get(cacheKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const content = await readBlobContent(blobKey(filename));
      if (!content) return false;
      ensureRuntimeDir();
      fs.writeFileSync(runtimePath, content, "utf8");
      return true;
    } catch (error) {
      console.error(`Failed to hydrate ${filename} from Vercel Blob:`, error);
      return false;
    } finally {
      hydrationPromises.delete(cacheKey);
    }
  })();

  hydrationPromises.set(cacheKey, promise);
  return promise;
}

export async function ensureDataFileHydrated(
  filename: string,
  defaultContent = "{}",
  options?: { force?: boolean }
): Promise<void> {
  if (!isVercelRuntime()) return;

  // Critical runtime files must always re-pull Blob so a cold instance
  // does not keep an empty seed written by ensureRuntimeFile.
  const force =
    options?.force ?? AWAIT_BLOB_PERSIST_FILES.has(filename);

  const hydrated = await hydrateFileFromBlob(filename, force);
  if (!hydrated) {
    ensureRuntimeFile(filename, defaultContent);
  }
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

        const content = await readBlobContent(blob.pathname);
        if (!content) continue;
        const runtimePath = getRuntimePath(filename);
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
  // Strip UTF-8 BOM (PowerShell Set-Content -Encoding UTF8 adds it on Windows)
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as T;
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
      `[data-store] BLOB_READ_WRITE_TOKEN is not set - ${filename} will be lost on the next deploy.`
    );
  }
}

export async function writeJsonFileAsync(
  filename: string,
  data: unknown,
  defaultContent = "{}"
): Promise<void> {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  const filePath = ensureRuntimeFile(filename, defaultContent);
  fs.writeFileSync(filePath, content, "utf8");
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // chmod is best-effort
  }

  if (isVercelRuntime() && isBlobEnabled()) {
    if (AWAIT_BLOB_PERSIST_FILES.has(filename)) {
      await persistToBlob(filename, content);
    } else {
      scheduleBlobPersist(filename, content);
    }
  } else if (isVercelRuntime() && !isBlobEnabled()) {
    console.warn(
      `[data-store] BLOB_READ_WRITE_TOKEN is not set - ${filename} will be lost on the next deploy.`
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
      `[data-store] BLOB_READ_WRITE_TOKEN is not set - ${filename} will be lost on the next deploy.`
    );
  }
}