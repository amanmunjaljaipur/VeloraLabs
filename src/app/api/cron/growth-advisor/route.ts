import { verifyApiKey } from "@/lib/api-key-auth";
import { listTenants } from "@/lib/marketing/tenants-store";
import { generateStrategy, executeGrowthActions, isGrowthAdvisorConfigured } from "@/lib/marketing/ai-growth-advisor";
import { recordGrowthExecution } from "@/lib/marketing/growth-memory-store";
import { logError } from "@/lib/diagnostics/log-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Vercel Cron (once daily, see vercel.json): this is the "learns daily"
 * half of the Growth Advisor. For every workspace, generates a fresh
 * strategy (which reads the last 5 days of its own history back into the
 * prompt, so the advice compounds instead of repeating) and appends it to
 * growth-memory-store.ts. Workspaces that have opted into autoGrowthEnabled
 * also get their suggested actions executed automatically; everyone else
 * just gets the day's insights logged for review via the "Execute" button.
 * Auth: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const cronHeader = request.headers.get("authorization");
  const vercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!vercelCron && !verifyApiKey(request, "CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGrowthAdvisorConfigured()) {
    return NextResponse.json({ skipped: true, reason: "AI not configured" });
  }

  const tenants = await listTenants();
  const results: Array<{ tenantId: string; executed: boolean }> = [];

  for (const tenant of tenants) {
    try {
      const entry = await generateStrategy(tenant.id, "daily-cron");
      if (tenant.autoGrowthEnabled && entry.suggestedActions.length > 0) {
        const executed = await executeGrowthActions(
          tenant.id,
          entry.suggestedActions.map((a) => a.key)
        );
        await recordGrowthExecution(entry.id, tenant.id, executed);
        results.push({ tenantId: tenant.id, executed: true });
      } else {
        results.push({ tenantId: tenant.id, executed: false });
      }
    } catch (error) {
      console.error(`Growth advisor failed for tenant ${tenant.id}:`, error);
      void logError("cron/growth-advisor", "tenant_failed", {
        tenantId: tenant.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}
