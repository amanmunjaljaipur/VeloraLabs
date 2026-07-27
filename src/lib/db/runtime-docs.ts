import { ensureRuntimeSchema, getSql, isDatabaseConfigured } from "@/lib/db/postgres";

/**
 * Key/value document store for all former Blob JSON files
 * (avatar-*, marketing-*, user-roles, etc.). One row per filename.
 * Binary media is NOT stored here — use Google Drive or Blob media keys.
 */

export async function getRuntimeDoc(filename: string): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    await ensureRuntimeSchema();
    const client = getSql();
    if (!client) return null;
    const rows = await client`
      SELECT content FROM runtime_docs WHERE filename = ${filename} LIMIT 1
    `;
    const row = rows[0] as { content?: string } | undefined;
    return typeof row?.content === "string" ? row.content : null;
  } catch (error) {
    console.error(`[db/runtime-docs] get failed for ${filename}:`, error);
    return null;
  }
}

export async function putRuntimeDoc(filename: string, content: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    await ensureRuntimeSchema();
    const client = getSql();
    if (!client) return false;
    await client`
      INSERT INTO runtime_docs (filename, content, updated_at)
      VALUES (${filename}, ${content}, NOW())
      ON CONFLICT (filename) DO UPDATE
      SET content = EXCLUDED.content,
          updated_at = NOW()
    `;
    return true;
  } catch (error) {
    console.error(`[db/runtime-docs] put failed for ${filename}:`, error);
    return false;
  }
}

export async function listRuntimeDocFilenames(prefix = ""): Promise<string[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    await ensureRuntimeSchema();
    const client = getSql();
    if (!client) return [];
    const rows = prefix
      ? await client`
          SELECT filename FROM runtime_docs
          WHERE filename LIKE ${prefix + "%"}
          ORDER BY filename ASC
        `
      : await client`SELECT filename FROM runtime_docs ORDER BY filename ASC`;
    return (rows as { filename: string }[]).map((r) => r.filename).filter(Boolean);
  } catch (error) {
    console.error("[db/runtime-docs] list failed:", error);
    return [];
  }
}

export async function deleteRuntimeDoc(filename: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    await ensureRuntimeSchema();
    const client = getSql();
    if (!client) return false;
    await client`DELETE FROM runtime_docs WHERE filename = ${filename}`;
    return true;
  } catch (error) {
    console.error(`[db/runtime-docs] delete failed for ${filename}:`, error);
    return false;
  }
}
