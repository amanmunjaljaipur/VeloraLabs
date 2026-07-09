import { get, list } from "@vercel/blob";
import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");
const BLOB_PREFIX = "verlin-labs/data/";

const RUNTIME_FILES = [
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
];

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

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required to pull from Vercel Blob.");
  }

  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  const blobsByName = new Set<string>();
  let cursor: string | undefined;

  do {
    const result = await list({ prefix: BLOB_PREFIX, cursor, limit: 1000 });
    for (const blob of result.blobs) {
      const filename = blob.pathname.startsWith(BLOB_PREFIX)
        ? blob.pathname.slice(BLOB_PREFIX.length)
        : blob.pathname;
      if (filename) blobsByName.add(filename);
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  let downloaded = 0;
  let missing = 0;

  for (const filename of RUNTIME_FILES) {
    if (!blobsByName.has(filename)) {
      missing += 1;
      console.log(`Missing in Blob: ${filename}`);
      continue;
    }

    const content = await readBlobContent(`${BLOB_PREFIX}${filename}`);
    if (!content) {
      console.warn(`Failed to download ${filename}`);
      missing += 1;
      continue;
    }

    fs.writeFileSync(path.join(CONTENT_DIR, filename), content, "utf8");
    downloaded += 1;
    console.log(`Downloaded ${filename}`);
  }

  console.log(`Pull complete. Downloaded ${downloaded}, missing ${missing}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});