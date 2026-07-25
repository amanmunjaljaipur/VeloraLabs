import { getPendingTrainingPool, markConsumedByBatch } from "@/lib/avatar-studio/feedback-store";
import {
  createTrainingBatch,
  completeTrainingBatch,
  getTrainingSettings,
  listTrainingBatches,
  type TrainingBatch,
} from "@/lib/avatar-studio/training-store";
import { auditStage, auditFailure } from "@/lib/avatar-studio/agents/audit-agent";

/**
 * Fine-Tuning Orchestrator Agent: the daily self-improving training loop
 * (Section 7). Checks the owner-controlled pause flag FIRST, always -
 * that's the non-negotiable from the mid-flight requirement that training
 * stay in the platform owner's control. Every run leaves a permanent,
 * never-deleted TrainingBatch record with exact data lineage
 * (feedbackEntryIds), whether it actually trained anything or not.
 *
 * The batch's actual fine-tuning step needs a GPU training host this
 * sandbox doesn't have, so - same honest-stub pattern as Voice/Avatar - this
 * agent does the REAL part (assemble the consented data pool, snapshot it
 * into a durable batch, mark it consumed so nothing is double-counted) and
 * is explicit about the part it can't do yet: if TRAINING_ENDPOINT_URL is
 * configured, it dispatches the batch there; if not, the batch is left at
 * "pending" with a clear note, rather than being marked "passed_deployed"
 * for a fine-tune that never happened.
 *
 * Expected endpoint contract (implement on your GPU training host):
 *   POST {TRAINING_ENDPOINT_URL}
 *   body: { batchId, feedbackEntryIds }
 *   response: { status: "accepted" } | { error: string }
 *   (the host is expected to report back its own outcome asynchronously via
 *   whatever mechanism it has - this scaffold only hands off the job)
 */

const MIN_FEEDBACK_ENTRIES = 5;

export async function runTrainingCycle(triggeredBy: "cron" | "manual", triggeredByEmail: string | null): Promise<TrainingBatch> {
  const settings = await getTrainingSettings();
  const windowEnd = new Date();

  if (settings.paused) {
    const batch = await createTrainingBatch({
      triggeredBy,
      triggeredByEmail,
      windowStart: await lastWindowStart(),
      windowEnd: windowEnd.toISOString(),
      modelId: null,
      correctionType: null,
      feedbackEntryIds: [],
      status: "skipped_paused",
    });
    auditStage("training", "cycle_skipped_paused", { batchId: batch.id, pausedBy: settings.pausedBy });
    return completeTrainingBatch(batch.id, { status: "skipped_paused", evaluationNotes: `Paused by ${settings.pausedBy ?? "owner"} at ${settings.pausedAt}` }).then((b) => b ?? batch);
  }

  const windowStart = await lastWindowStart();
  const pool = await getPendingTrainingPool(new Date(windowStart));

  if (pool.length < MIN_FEEDBACK_ENTRIES) {
    const batch = await createTrainingBatch({
      triggeredBy,
      triggeredByEmail,
      windowStart,
      windowEnd: windowEnd.toISOString(),
      modelId: null,
      correctionType: null,
      feedbackEntryIds: pool.map((f) => f.id),
      status: "skipped_insufficient_data",
    });
    auditStage("training", "cycle_skipped_insufficient_data", { batchId: batch.id, poolSize: pool.length, required: MIN_FEEDBACK_ENTRIES });
    return completeTrainingBatch(batch.id, {
      status: "skipped_insufficient_data",
      evaluationNotes: `Only ${pool.length} consented, unconsumed feedback entries (need ${MIN_FEEDBACK_ENTRIES}+) since ${windowStart}`,
    }).then((b) => b ?? batch);
  }

  const feedbackEntryIds = pool.map((f) => f.id);
  const batch = await createTrainingBatch({
    triggeredBy,
    triggeredByEmail,
    windowStart,
    windowEnd: windowEnd.toISOString(),
    modelId: null,
    correctionType: null,
    feedbackEntryIds,
    status: "running",
  });

  // Mark consumed immediately so a second cycle (manual trigger racing the
  // cron, or a retry) never double-counts these entries into another batch -
  // the batch record above already has the permanent lineage either way.
  await markConsumedByBatch(feedbackEntryIds, batch.id);

  const endpointUrl = process.env.TRAINING_ENDPOINT_URL;
  if (!endpointUrl) {
    auditStage("training", "cycle_data_collected_no_endpoint", { batchId: batch.id, poolSize: pool.length });
    const completed = await completeTrainingBatch(batch.id, {
      status: "pending",
      evaluationNotes: `${pool.length} feedback entries collected and retained for training - no GPU training endpoint configured yet (set TRAINING_ENDPOINT_URL). Data is durable and will not be re-collected.`,
    });
    return completed ?? batch;
  }

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: batch.id, feedbackEntryIds }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.status !== "accepted") {
      auditFailure("training", "cycle_dispatch_failed", data?.error ?? "Training endpoint rejected the batch", { batchId: batch.id });
      const completed = await completeTrainingBatch(batch.id, {
        status: "failed_evaluation",
        evaluationNotes: data?.error ?? "Training endpoint rejected the batch",
      });
      return completed ?? batch;
    }
    auditStage("training", "cycle_dispatched", { batchId: batch.id, poolSize: pool.length });
    const completed = await completeTrainingBatch(batch.id, {
      status: "pending",
      evaluationNotes: `Handed off to the training host - ${pool.length} feedback entries. Awaiting that host's own evaluation/deploy report.`,
    });
    return completed ?? batch;
  } catch (error) {
    auditFailure("training", "cycle_dispatch_errored", error instanceof Error ? error.message : "Unknown error", { batchId: batch.id });
    const completed = await completeTrainingBatch(batch.id, {
      status: "failed_evaluation",
      evaluationNotes: "Could not reach the training endpoint",
    });
    return completed ?? batch;
  }
}

/** Start of the next window = end of the most recent COMPLETED (non-skipped-for-pause) batch, so cycles don't overlap; falls back to 30 days ago on the very first run. */
async function lastWindowStart(): Promise<string> {
  const batches = await listTrainingBatches(20);
  const lastReal = batches.find((b) => b.status !== "skipped_paused");
  if (lastReal) return lastReal.windowEnd;
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}
