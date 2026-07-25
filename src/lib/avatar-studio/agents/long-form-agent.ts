import { getModel } from "@/lib/avatar-studio/model-catalog";
import { generateWithFailover } from "@/lib/avatar-studio/agents/model-failover";
import { generateVoice } from "@/lib/avatar-studio/agents/voice-agent";
import { generateAvatarVideo } from "@/lib/avatar-studio/agents/avatar-agent";
import { extractLastFrame, stitchClips } from "@/lib/avatar-studio/agents/video-stitch-agent";
import { evaluateOutput } from "@/lib/avatar-studio/agents/qa-agent";
import { auditStage, auditFailure } from "@/lib/avatar-studio/agents/audit-agent";
import { refundTokens } from "@/lib/avatar-studio/token-ledger-store";
import { getJobById, updateJob, type AvatarJob, type LongFormSegmentState } from "@/lib/avatar-studio/jobs-store";

/**
 * Long-Form Agent: assembles a long video (up to ~20 min) from many short
 * clips, chained via last-frame continuity - "if a model only produces
 * 10-second clips, take the last frame of clip N and use it as the starting
 * frame for clip N+1, then stitch everything together." Each clip's
 * voice/avatar generation independently runs through the multi-model
 * failover helper (model-failover.ts), so a model running out of free
 * quota mid-job doesn't stall the whole video - the next model in the
 * catalog picks up the remaining clips.
 *
 * Processes segments incrementally and time-boxes itself (TIME_BUDGET_MS)
 * so one invocation never tries to render a 20-minute video (potentially
 * 100+ sequential clips against real GPU endpoints) in a single serverless
 * call. Progress is persisted to the job record after every segment, so the
 * avatar-studio-queue cron sweep safely resumes an in-progress long-form
 * job exactly where the last invocation left off - no separate queue needed.
 */

const WORDS_PER_MINUTE = 150;
const DEFAULT_CLIP_SECONDS = 10;
const TIME_BUDGET_MS = 45_000; // stays under a 60s function; cron resumes the rest

/**
 * Splits a script into segments sized to the avatar model's maxClipSeconds
 * (model-catalog.ts), grouping whole sentences so no clip cuts off
 * mid-sentence. A single very long sentence can still exceed the target -
 * accepted degradation rather than breaking mid-word.
 */
export async function planSegments(script: string, avatarModelId: string): Promise<LongFormSegmentState[]> {
  const model = await getModel(avatarModelId);
  const clipSeconds = model?.maxClipSeconds ?? DEFAULT_CLIP_SECONDS;
  const wordsPerClip = Math.max(3, Math.round((clipSeconds / 60) * WORDS_PER_MINUTE));

  const sentences = script.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);

  const chunks: string[] = [];
  let current: string[] = [];
  let currentWordCount = 0;
  for (const sentence of sentences) {
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;
    if (currentWordCount > 0 && currentWordCount + wordCount > wordsPerClip) {
      chunks.push(current.join(" "));
      current = [];
      currentWordCount = 0;
    }
    current.push(sentence);
    currentWordCount += wordCount;
  }
  if (current.length > 0) chunks.push(current.join(" "));

  return chunks.map((text, index) => ({
    index,
    text,
    status: "pending",
    voiceModelIdUsed: null,
    avatarModelIdUsed: null,
    audioRef: null,
    videoRef: null,
    lastFrameRef: null,
    attemptedModels: [],
    error: null,
  }));
}

async function failLongFormJob(job: AvatarJob, segments: LongFormSegmentState[], failedIndex: number, error: string): Promise<void> {
  const nextSegments = [...segments];
  if (nextSegments[failedIndex]) {
    nextSegments[failedIndex] = { ...nextSegments[failedIndex]!, status: "failed", error };
  }

  const completedCount = nextSegments.filter((s) => s.status === "complete").length;
  const totalCount = nextSegments.length || 1;
  const refundAmount = Math.round((job.tokensReserved * (totalCount - completedCount)) / totalCount);

  auditFailure(job.id, "long_form", error, { completedCount, totalCount, refundAmount });
  if (refundAmount > 0) {
    await refundTokens(job.email, refundAmount, job.id, `Long-form job failed after ${completedCount}/${totalCount} segments: ${error}`);
  }
  await updateJob(job.id, {
    status: "failed",
    error,
    segments: nextSegments,
    tokensReserved: Math.max(0, job.tokensReserved - refundAmount),
  });
}

export async function processLongFormJob(jobId: string): Promise<void> {
  const job = await getJobById(jobId);
  if (!job) return;
  if (["complete", "failed", "rejected"].includes(job.status)) return;
  if (!job.segments || job.segments.length === 0) {
    await updateJob(jobId, { status: "failed", error: "Long-form job has no planned segments" });
    return;
  }

  const totalSegments = job.segments.length;
  const alreadyDone = job.segments.filter((s) => s.status === "complete").length;
  auditStage(jobId, "long_form_resume", { totalSegments, alreadyDone });

  let segments = job.segments;
  const lastCompleted = [...segments].reverse().find((s) => s.status === "complete");
  let previousFrameUrl: string | null = lastCompleted?.lastFrameRef?.url ?? null;

  const startedAt = Date.now();

  for (let i = 0; i < segments.length; i++) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      auditStage(jobId, "long_form_time_budget_reached", { resumeAtIndex: i, of: totalSegments });
      return; // job stays non-terminal; the cron sweep resumes from here
    }

    const segment = segments[i]!;
    if (segment.status === "complete") continue;

    // --- Voice, with multi-model failover ---
    segments = segments.map((s, idx) => (idx === i ? { ...s, status: "generating_voice" as const } : s));
    await updateJob(jobId, { segments, status: "generating_voice" });

    const voiceOutcome = await generateWithFailover("voice", job.voiceModelId, (modelId) =>
      generateVoice(modelId, segment.text, job.qualityTier, job.avatarProfileId)
    );

    if (!voiceOutcome.result.ok || !voiceOutcome.modelIdUsed) {
      segments = segments.map((s, idx) =>
        idx === i ? { ...s, attemptedModels: [...s.attemptedModels, ...voiceOutcome.attemptedModels.map((m) => `voice:${m}`)] } : s
      );
      await failLongFormJob(job, segments, i, voiceOutcome.result.error ?? "Voice generation failed for this segment");
      return;
    }

    segments = segments.map((s, idx) =>
      idx === i
        ? {
            ...s,
            voiceModelIdUsed: voiceOutcome.modelIdUsed,
            audioRef: voiceOutcome.result.storageRef,
            attemptedModels: [...s.attemptedModels, ...voiceOutcome.attemptedModels.map((m) => `voice:${m}`)],
          }
        : s
    );

    // --- Avatar, with multi-model failover + previous-frame continuity ---
    segments = segments.map((s, idx) => (idx === i ? { ...s, status: "generating_avatar" as const } : s));
    await updateJob(jobId, { segments, status: "generating_avatar" });

    const audioUrl = segments[i]!.audioRef?.url ?? "";
    const framePassedIn = previousFrameUrl;
    const avatarOutcome = await generateWithFailover("avatar", job.avatarModelId, (modelId) =>
      generateAvatarVideo(modelId, audioUrl, job.qualityTier, job.avatarProfileId, framePassedIn)
    );

    if (!avatarOutcome.result.ok || !avatarOutcome.modelIdUsed) {
      segments = segments.map((s, idx) =>
        idx === i ? { ...s, attemptedModels: [...s.attemptedModels, ...avatarOutcome.attemptedModels.map((m) => `avatar:${m}`)] } : s
      );
      await failLongFormJob(job, segments, i, avatarOutcome.result.error ?? "Avatar generation failed for this segment");
      return;
    }

    segments = segments.map((s, idx) =>
      idx === i
        ? {
            ...s,
            avatarModelIdUsed: avatarOutcome.modelIdUsed,
            videoRef: avatarOutcome.result.storageRef,
            attemptedModels: [...s.attemptedModels, ...avatarOutcome.attemptedModels.map((m) => `avatar:${m}`)],
          }
        : s
    );

    // --- Extract this clip's last frame so the NEXT clip can chain from it ---
    const clipVideoUrl = segments[i]!.videoRef?.url;
    if (i < segments.length - 1 && clipVideoUrl) {
      const frame = await extractLastFrame(clipVideoUrl);
      if (frame.ok) {
        segments = segments.map((s, idx) => (idx === i ? { ...s, lastFrameRef: frame.ref } : s));
        previousFrameUrl = frame.ref.url;
      } else {
        // Non-fatal: the next clip just won't visually chain from this one,
        // rather than failing an otherwise-successful video over a frame
        // extraction hiccup.
        auditStage(jobId, "long_form_frame_extract_failed", { segmentIndex: i, error: frame.error });
        previousFrameUrl = null;
      }
    }

    segments = segments.map((s, idx) => (idx === i ? { ...s, status: "complete" as const } : s));
    await updateJob(jobId, { segments });
    auditStage(jobId, "long_form_segment_complete", { segmentIndex: i, of: totalSegments });
  }

  // --- Every segment done: stitch into the final video ---
  const clipUrls = segments.map((s) => s.videoRef?.url).filter((u): u is string => Boolean(u));
  const expectedMinutes = job.targetDurationMinutes ?? (totalSegments * DEFAULT_CLIP_SECONDS) / 60;
  const stitched = await stitchClips(clipUrls);

  if (!stitched.ok) {
    await failLongFormJob(job, segments, segments.length - 1, `All ${totalSegments} clips generated, but stitching them into one video failed: ${stitched.error}`);
    return;
  }

  const qa = evaluateOutput({
    voiceOk: true,
    avatarOk: true,
    durationSeconds: stitched.durationSeconds > 0 ? stitched.durationSeconds : null,
    expectedMinutes,
  });

  await updateJob(jobId, {
    status: "complete",
    qaScore: qa.score,
    outputVideo: stitched.ref,
    segments,
    completedAt: new Date().toISOString(),
    error: null,
  });
  auditStage(jobId, "long_form_complete", { totalSegments, qaScore: qa.score });
}
