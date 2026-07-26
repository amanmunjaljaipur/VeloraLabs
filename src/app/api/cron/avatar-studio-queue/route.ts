import { verifyApiKey } from "@/lib/api-key-auth";
import { listQueuedJobs, listRecentTerminalJobs, updateJob } from "@/lib/avatar-studio/jobs-store";
import { processJob } from "@/lib/avatar-studio/agents/queue-agent";
import { getReservedTokensForJob, hasAnyRefund, refundTokens } from "@/lib/avatar-studio/token-ledger-store";
import { logError } from "@/lib/diagnostics/log-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const STUCK_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes with no progress
const SWEEP_TIME_BUDGET_MS = 50_000; // leaves headroom under maxDuration=60; runs every 2 min (vercel.json), so anything left over is picked up next tick
const RECONCILE_LOOKBACK_MS = 24 * 60 * 60 * 1000; // 24h - catches anything the in-pipeline refund missed without rescanning the whole jobs history every tick

/**
 * Safety net for the Queue Agent (mirrors cron/marketing's claim-and-process
 * pattern): after() should handle nearly every job inline, but if the
 * instance handling it died mid-run, this sweep re-invokes processJob for
 * anything that's been sitting in a non-terminal status without a status
 * update for a while. processJob is mode-aware (delegates to
 * long-form-agent.ts's processLongFormJob for long-form jobs) and is
 * documented as safe-ish to re-run - single-clip jobs re-attempt from Voice
 * onward rather than skipping already-done stages (a real, accepted
 * inefficiency, not a correctness bug); long-form jobs resume exactly at
 * the first incomplete segment, so re-running them is cheap and correct.
 *
 * A single sweep also stops early once SWEEP_TIME_BUDGET_MS is spent, since
 * a long-form job can legitimately use up to ~45s per invocation
 * (long-form-agent.ts's own internal time-box) - several stuck long-form
 * jobs in one tick could otherwise blow past this function's own
 * maxDuration. Whatever doesn't get to run this tick is picked up on the
 * next one, 2 minutes later.
 *
 * Also runs a token-reconciliation pass over recently-terminated jobs: live
 * testing found a case where a job failed correctly but its refund never
 * fired (a read-after-write race on the job record - see
 * token-ledger-store.ts's getReservedTokensForJob doc comment). This pass
 * is the self-healing backstop for that class of bug - it only ever acts on
 * jobs with zero refund entries logged (hasAnyRefund), so it never
 * double-refunds a job that already went through a correct, even partial,
 * refund.
 *
 * Auth: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const cronHeader = request.headers.get("authorization");
  const vercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!vercelCron && !verifyApiKey(request, "CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queued = await listQueuedJobs();
  const stuck = queued.filter((job) => Date.now() - new Date(job.updatedAt).getTime() > STUCK_THRESHOLD_MS);

  const sweepStartedAt = Date.now();
  const results: Array<{ id: string; ok: boolean }> = [];
  let skippedForTimeBudget = 0;

  for (const job of stuck) {
    if (Date.now() - sweepStartedAt > SWEEP_TIME_BUDGET_MS) {
      skippedForTimeBudget = stuck.length - results.length;
      break;
    }
    try {
      await processJob(job.id);
      results.push({ id: job.id, ok: true });
    } catch (error) {
      results.push({ id: job.id, ok: false });
      void logError("cron/avatar-studio-queue", "processJob threw during sweep", { jobId: job.id, error: String(error) });
    }
  }

  // --- Token reconciliation: catch any refund the in-pipeline logic missed ---
  let reconciled = 0;
  let reconcileSkippedForTimeBudget = 0;
  if (Date.now() - sweepStartedAt <= SWEEP_TIME_BUDGET_MS) {
    const terminal = await listRecentTerminalJobs(RECONCILE_LOOKBACK_MS);
    for (const job of terminal) {
      if (Date.now() - sweepStartedAt > SWEEP_TIME_BUDGET_MS) {
        reconcileSkippedForTimeBudget = terminal.length - reconciled;
        break;
      }
      try {
        const alreadyRefunded = await hasAnyRefund(job.id);
        if (alreadyRefunded) continue;
        const outstanding = await getReservedTokensForJob(job.id);
        if (outstanding > 0) {
          await refundTokens(job.email, outstanding, job.id, "Reconciliation: refund-on-failure did not run for this job");
          await updateJob(job.id, { tokensReserved: 0 });
          reconciled += 1;
        }
      } catch (error) {
        void logError("cron/avatar-studio-queue", "reconciliation threw for job", { jobId: job.id, error: String(error) });
      }
    }
  }

  return NextResponse.json({
    success: true,
    swept: results.length,
    skippedForTimeBudget,
    results,
    reconciled,
    reconcileSkippedForTimeBudget,
  });
}
