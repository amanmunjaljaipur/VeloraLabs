import { verifyApiKey } from "@/lib/api-key-auth";
import { runTrainingCycle } from "@/lib/avatar-studio/agents/training-agent";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 45;

/**
 * Daily self-improving training loop (Section 7). Honors the owner's pause
 * flag first thing (training-agent.ts) - a paused cycle still logs a
 * permanent "skipped" batch record rather than silently doing nothing.
 * Auth: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const cronHeader = request.headers.get("authorization");
  const vercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!vercelCron && !verifyApiKey(request, "CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = await runTrainingCycle("cron", null);
  return NextResponse.json({ success: true, batch });
}
