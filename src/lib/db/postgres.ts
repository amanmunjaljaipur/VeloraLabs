import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Deploy-safe Postgres (Neon free tier / any Postgres URL).
 * Used as the primary home for runtime JSON so we stop growing Vercel Blob
 * with hundreds of small document rewrites.
 *
 * Set DATABASE_URL (or POSTGRES_URL / NEON_DATABASE_URL) in Vercel env.
 * Survives production deploys — data is not in the git bundle or /tmp.
 */

let sql: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

export function getDatabaseUrl(): string | null {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.NEON_DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    "";
  return url || null;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getSql(): NeonQueryFunction<false, false> | null {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!sql) {
    sql = neon(url);
  }
  return sql;
}

/** Create runtime document tables once per cold start. Idempotent. */
export async function ensureRuntimeSchema(): Promise<boolean> {
  const client = getSql();
  if (!client) return false;
  if (!schemaReady) {
    schemaReady = (async () => {
      await client`
        CREATE TABLE IF NOT EXISTS runtime_docs (
          filename TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await client`
        CREATE INDEX IF NOT EXISTS runtime_docs_updated_at_idx
        ON runtime_docs (updated_at DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      console.error("[db/postgres] schema ensure failed:", error);
      throw error;
    });
  }
  await schemaReady;
  return true;
}

export type DurableBackend = "postgres" | "blob" | "local-only";

/**
 * Prefer Postgres for structured runtime data (cheap, durable).
 * Blob remains for binary media when Drive is not connected.
 * Local filesystem is only for non-Vercel dev.
 */
export function resolveDurableBackend(): DurableBackend {
  if (isDatabaseConfigured()) return "postgres";
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return "local-only";
}
