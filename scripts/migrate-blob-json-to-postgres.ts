/**
 * One-shot: copy runtime JSON documents from Vercel Blob → Postgres
 * so structured data no longer lives on (costly) Blob.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/migrate-blob-json-to-postgres.ts
 *
 * Requires DATABASE_URL + BLOB_READ_WRITE_TOKEN.
 * Binary media under verlin-labs/avatar-studio/ etc. is NOT migrated.
 */

import { list, get } from "@vercel/blob";
import { putRuntimeDoc } from "../src/lib/db/runtime-docs";
import { ensureRuntimeSchema, isDatabaseConfigured } from "../src/lib/db/postgres";

const BLOB_PREFIX = "verlin-labs/data/";

async function readBlob(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const reader = result.stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder().decode(merged);
}

async function main() {
  if (!isDatabaseConfigured()) {
    console.error("DATABASE_URL (or POSTGRES_URL / NEON_DATABASE_URL) is required");
    process.exit(1);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is required to read existing Blob JSON");
    process.exit(1);
  }

  await ensureRuntimeSchema();
  console.log("Schema ready. Listing Blob JSON under", BLOB_PREFIX);

  let cursor: string | undefined;
  let ok = 0;
  let fail = 0;

  do {
    const result = await list({ prefix: BLOB_PREFIX, cursor, limit: 200 });
    for (const blob of result.blobs) {
      const filename = blob.pathname.startsWith(BLOB_PREFIX)
        ? blob.pathname.slice(BLOB_PREFIX.length)
        : blob.pathname;
      if (!filename || filename.includes("..") || !filename.endsWith(".json")) continue;

      try {
        const content = await readBlob(blob.pathname);
        if (!content) {
          console.warn("empty:", filename);
          fail++;
          continue;
        }
        const saved = await putRuntimeDoc(filename, content);
        if (saved) {
          ok++;
          console.log("migrated:", filename, `(${content.length} bytes)`);
        } else {
          fail++;
          console.error("failed put:", filename);
        }
      } catch (e) {
        fail++;
        console.error("error:", filename, e);
      }
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  console.log(`Done. ok=${ok} fail=${fail}`);
  console.log("After verifying app reads, you can leave Blob for media only.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
