import { auth } from "@/auth";
import { isSuperAdminRole } from "@/lib/session-access";
import { getDurableBackend } from "@/lib/data-store";
import { ensureRuntimeSchema, getDatabaseUrl, isDatabaseConfigured } from "@/lib/db/postgres";
import { listRuntimeDocFilenames } from "@/lib/db/runtime-docs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Super-admin: which durable backend is active (Postgres vs Blob vs local).
 * Confirms deploy-safe configuration without exposing secrets.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isSuperAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backend = getDurableBackend();
  let postgresOk = false;
  let docCount: number | null = null;
  let schemaError: string | null = null;

  if (isDatabaseConfigured()) {
    try {
      await ensureRuntimeSchema();
      const names = await listRuntimeDocFilenames();
      docCount = names.length;
      postgresOk = true;
    } catch (e) {
      schemaError = e instanceof Error ? e.message : String(e);
    }
  }

  const url = getDatabaseUrl();
  const redacted =
    url != null
      ? url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@").replace(/([?&]password=)[^&]+/i, "$1***")
      : null;

  return NextResponse.json({
    backend,
    postgres: {
      configured: isDatabaseConfigured(),
      ok: postgresOk,
      documentCount: docCount,
      schemaError,
      urlHost: redacted,
    },
    blob: {
      configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      usedForJson: backend === "blob" || process.env.DURABLE_JSON_DUAL_WRITE === "1",
      usedForMedia: true,
    },
    policy: {
      jsonPrimary: backend === "postgres" ? "postgres" : backend === "blob" ? "vercel-blob" : "local-filesystem",
      media: "google-drive-if-connected else vercel-blob",
      survivesDeploy: backend === "postgres" || backend === "blob",
    },
  });
}
