import { list, put } from "@vercel/blob";
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
  "home-content.json",
  "faq-content.json",
  "site.json",
  "trust-signals.json",
];

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required to seed Vercel Blob.");
  }

  const existing = new Set<string>();
  let cursor: string | undefined;

  do {
    const result = await list({ prefix: BLOB_PREFIX, cursor, limit: 1000 });
    for (const blob of result.blobs) {
      const filename = blob.pathname.startsWith(BLOB_PREFIX)
        ? blob.pathname.slice(BLOB_PREFIX.length)
        : blob.pathname;
      if (filename) existing.add(filename);
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  let uploaded = 0;
  let skipped = 0;

  for (const filename of RUNTIME_FILES) {
    const filePath = path.join(CONTENT_DIR, filename);
    if (!fs.existsSync(filePath)) {
      skipped += 1;
      continue;
    }

    if (existing.has(filename)) {
      skipped += 1;
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    await put(`${BLOB_PREFIX}${filename}`, content, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    uploaded += 1;
    console.log(`Uploaded ${filename}`);
  }

  console.log(`Seed complete. Uploaded ${uploaded}, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});