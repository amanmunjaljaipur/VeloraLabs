import { logError } from "@/lib/diagnostics/log-store";

/**
 * Audit Agent: logs agent decisions and stage transitions for every job
 * (Section 12's "audit logging on every generation: model version, agent
 * decisions, token consumption, job ID" requirement). The AvatarJob record
 * itself (jobs-store.ts) already carries the durable per-job state
 * (status, moderationNote, qaScore, tokensReserved, error, timestamps) -
 * that record IS the primary audit trail. This agent additionally routes
 * failures into the existing persistent, super-admin-visible diagnostics
 * log (log-store.ts, already used platform-wide) so job failures surface
 * in the same place every other production issue does, rather than a
 * separate Avatar-Studio-only log nobody checks.
 */

const LOG_PAGE = "avatar-studio/job-pipeline";

export function auditStage(jobId: string, stage: string, detail: Record<string, unknown>): void {
  console.log(`[avatar-studio/audit] job=${jobId} stage=${stage}`, detail);
}

export function auditFailure(jobId: string, stage: string, reason: string, detail?: Record<string, unknown>): void {
  console.error(`[avatar-studio/audit] job=${jobId} stage=${stage} FAILED: ${reason}`, detail);
  void logError(LOG_PAGE, reason, { jobId, stage, ...detail });
}
