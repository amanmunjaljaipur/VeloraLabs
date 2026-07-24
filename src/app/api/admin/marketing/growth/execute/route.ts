import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { executeGrowthActions } from "@/lib/marketing/ai-growth-advisor";
import { recordGrowthExecution } from "@/lib/marketing/growth-memory-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The "single button press: execute" endpoint. Body: { entryId, actionKeys: string[] }
 * Runs the given actions for real (schedule a viral post, sync+triage inbox,
 * find prospects) and records what happened against the strategy entry that
 * suggested them, so the history shows advice alongside outcome.
 */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const entryId = typeof body?.entryId === "string" ? body.entryId : "";
  const actionKeys = Array.isArray(body?.actionKeys)
    ? body.actionKeys.filter((k: unknown): k is string => typeof k === "string")
    : [];

  if (!entryId || actionKeys.length === 0) {
    return NextResponse.json({ error: "entryId and at least one actionKey are required" }, { status: 400 });
  }

  const tenantId = await resolveTenantId(session.user?.email);
  const results = await executeGrowthActions(tenantId, actionKeys);
  await recordGrowthExecution(entryId, tenantId, results);

  return NextResponse.json({ results });
}
