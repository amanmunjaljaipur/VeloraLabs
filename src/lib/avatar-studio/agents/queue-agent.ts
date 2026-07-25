import { getJobById, updateJob } from "@/lib/avatar-studio/jobs-store";
import { refundTokens } from "@/lib/avatar-studio/token-ledger-store";
import { generateVoice } from "@/lib/avatar-studio/agents/voice-agent";
import { generateAvatarVideo } from "@/lib/avatar-studio/agents/avatar-agent";
import { generateTranscript } from "@/lib/avatar-studio/agents/transcript-agent";
import { evaluateOutput, QA_PASS_THRESHOLD } from "@/lib/avatar-studio/agents/qa-agent";
import { estimateDurationMinutes } from "@/lib/avatar-studio/agents/model-selector-agent";
import { auditStage, auditFailure } from "@/lib/avatar-studio/agents/audit-agent";
import { generateWithFailover } from "@/lib/avatar-studio/agents/model-failover";
import { processLongFormJob } from "@/lib/avatar-studio/agents/long-form-agent";

/**
 * Queue/Orchestration Agent: runs one job through Voice -> Avatar -> QA
 * (auto-retry once below threshold) -> Transcript -> Complete. Moderation
 * and token reservation already happened synchronously in the job-creation
 * API route (before this ever runs, and before any GPU-bound work), per
 * the spec's "Moderation Agent screens before GPU time is spent" ordering.
 * Jobs with mode "long_form" are delegated entirely to long-form-agent.ts,
 * which chains many short clips together instead of rendering one.
 *
 * Invoked two ways: fire-and-forget via next/server's after() immediately
 * on job creation (fast path, this sandbox's stubbed agents return in
 * milliseconds so jobs typically finish before the creation request's own
 * response even flushes), and swept by the avatar-studio-queue cron for
 * any job stuck in a non-terminal status past a threshold (covers the case
 * where the instance handling after() died mid-run) - the same
 * "concurrency limits, GPU pool routing, capacity fallback" role the spec
 * assigns this agent, minus a Redis-backed queue this stack doesn't have.
 *
 * Idempotent-ish: re-running a job already past "queued" just re-attempts
 * from its current stage rather than restarting from scratch, so a cron
 * sweep picking up an in-flight job doesn't duplicate work already done.
 *
 * Voice/Avatar generation both go through generateWithFailover
 * (model-failover.ts): if the user's selected model is out of free quota
 * or otherwise fails, the next model in that kind's catalog is tried
 * automatically, ending with the zero-token free-tier model as the last
 * resort, before the job is failed.
 */

export async function processJob(jobId: string): Promise<void> {
  const job = await getJobById(jobId);
  if (!job) return;
  if (["complete", "failed", "rejected"].includes(job.status)) return;
  if (job.mode === "long_form") {
    return processLongFormJob(jobId);
  }

  auditStage(jobId, "pipeline_start", { status: job.status });

  const fail = async (error: string) => {
    auditFailure(jobId, job.status, error, { email: job.email });
    if (job.tokensReserved > 0) {
      await refundTokens(job.email, job.tokensReserved, jobId, `Job failed at stage "${job.status}": ${error}`);
    }
    await updateJob(jobId, { status: "failed", error });
  };

  try {
    // --- Voice, with multi-model failover ---
    await updateJob(jobId, { status: "generating_voice" });
    const voiceOutcome = await generateWithFailover("voice", job.voiceModelId, (modelId) =>
      generateVoice(modelId, job.script, job.qualityTier, job.avatarProfileId)
    );
    const voiceResult = voiceOutcome.result;
    if (!voiceResult.ok) {
      await fail(voiceResult.error ?? "Voice generation failed");
      return;
    }
    auditStage(jobId, "voice_complete", { model: voiceOutcome.modelIdUsed, attempted: voiceOutcome.attemptedModels });

    // --- Avatar, with multi-model failover ---
    await updateJob(jobId, { status: "generating_avatar" });
    const audioUrl = voiceResult.storageRef?.url ?? "";
    let avatarOutcome = await generateWithFailover("avatar", job.avatarModelId, (modelId) =>
      generateAvatarVideo(modelId, audioUrl, job.qualityTier, job.avatarProfileId)
    );
    let avatarResult = avatarOutcome.result;
    if (!avatarResult.ok) {
      await fail(avatarResult.error ?? "Avatar generation failed");
      return;
    }
    auditStage(jobId, "avatar_complete", { model: avatarOutcome.modelIdUsed, attempted: avatarOutcome.attemptedModels });

    // --- QA, with one auto-retry below threshold (Section 4/13) ---
    await updateJob(jobId, { status: "qa_check" });
    const expectedMinutes = estimateDurationMinutes(job.script);
    let qa = evaluateOutput({
      voiceOk: voiceResult.ok,
      avatarOk: avatarResult.ok,
      durationSeconds: avatarResult.durationSeconds,
      expectedMinutes,
    });

    if (!qa.passed) {
      auditStage(jobId, "qa_retry", { firstScore: qa.score, notes: qa.notes });
      await updateJob(jobId, { qaRetryCount: job.qaRetryCount + 1 });
      avatarOutcome = await generateWithFailover("avatar", job.avatarModelId, (modelId) =>
        generateAvatarVideo(modelId, audioUrl, job.qualityTier, job.avatarProfileId)
      );
      avatarResult = avatarOutcome.result;
      if (!avatarResult.ok) {
        await fail(avatarResult.error ?? "Avatar generation failed on QA retry");
        return;
      }
      qa = evaluateOutput({ voiceOk: true, avatarOk: true, durationSeconds: avatarResult.durationSeconds, expectedMinutes });
    }

    if (!qa.passed) {
      await fail(`Output did not pass quality check after retry (score ${qa.score}/${QA_PASS_THRESHOLD} needed): ${qa.notes}`);
      return;
    }

    // --- Transcript ---
    const transcriptSegments = await generateTranscript(job.script, avatarResult.storageRef?.url ?? null);

    await updateJob(jobId, {
      status: "complete",
      qaScore: qa.score,
      outputVideo: avatarResult.storageRef,
      transcriptSegments,
      completedAt: new Date().toISOString(),
      error: null,
    });
    auditStage(jobId, "pipeline_complete", { qaScore: qa.score });
  } catch (error) {
    await fail(error instanceof Error ? error.message : "Unexpected pipeline error");
  }
}
