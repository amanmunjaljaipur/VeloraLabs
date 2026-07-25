import { verifyApiKey } from "@/lib/api-key-auth";
import { pruneOldLogs } from "@/lib/diagnostics/log-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron (once daily, see vercel.json): deletes diagnostic log shards
 * older than the retention window (~3 months) so storage doesn't grow
 * unbounded. Never touches shards inside the window.
 * Auth: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const cronHeader = request.headers.get("authorization");
  const vercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!vercelCron && !verifyApiKey(request, "CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pruneOldLogs();
  return NextResponse.json({ success: true, ...result });
}
