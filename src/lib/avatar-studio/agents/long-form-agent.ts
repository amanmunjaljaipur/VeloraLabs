import { getModel } from "@/lib/avatar-studio/model-catalog";
import { generateWithFailover } from "@/lib/avatar-studio/agents/model-failover";
import { generateVoice } from "@/lib/avatar-studio/agents/voice-agent";
import { generateAvatarVideo } from "@/lib/avatar-studio/agents/avatar-agent";
import { extractLastFrame, stitchClips } from "@/lib/avatar-studio/agents/video-stitch-agent";
import { evaluateOutput } from "@/lib/avatar-studio/agents/qa-agent";
import { generateTranscript } from "@/lib/avatar-studio/agents/transcript-agent";
import { auditStage, auditFailure } from "@/lib/avatar-studio/agents/audit-agent";
import { getReservedTokensForJob, refundTokens } from "@/lib/avatar-studio/token-ledger-store";
import { getJobById, updateJob, type AvatarJob, type LongFormSegmentState } from "@/lib/avatar-studio/jobs-store";
import { getUserSettings } from "@/lib/avatar-studio/user-settings-store";
import { FREE_MAX_CLIP_SECONDS } from "@/lib/avatar-studio/freemium";

/**
 * Long-Form Agent: freemium path produces one narrated Presenter package
 * for the full script (no GPU stitch). Custom/paid lip-sync hosts still
 * chain short clips via last-frame continuity + ffmpeg stitch URLs.
 */

const WORDS_PER_MINUTE = 150;
const DEFAULT_CLIP_SECONDS = FREE_MAX_CLIP_SECONDS;
const TIME_BUDGET_MS = 45_000;

export async function planSegments(script: string, avatarModelId: string): Promise<LongFormSegmentState[]> {
  const model = await getModel(avatarModelId);
  const clipSeconds = model?.maxClipSeconds ?? DEFAULT_CLIP_SECONDS;
  const wordsPerClip = Math.max(3, Math.round((clipSeconds / 60) * WORDS_PER_MINUTE));

  const sentences = script
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

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
  const totalReserved = await getReservedTokensForJob(job.id);
  const refundAmount = Math.round((totalReserved * (totalCount - completedCount)) / totalCount);

  auditFailure(job.id, "long_form", error, { completedCount, totalCount, refundAmount, totalReserved });
  if (refundAmount > 0) {
    await refundTokens(job.email, refundAmount, job.id, `Long-form job failed after ${completedCount}/${totalCount} segments: ${error}`);
  }
  await updateJob(job.id, {
    status: "failed",
    error,
    segments: nextSegments,
    tokensReserved: Math.max(0, totalReserved - refundAmount),
  });
}

async function isFreePresenterPath(email: string): Promise<boolean> {
  const settings = await getUserSettings(email);
  if (settings.avatarMode === "custom_url" && settings.avatarEndpointUrl) return false;
  const envHosted = Boolean(
    process.env.AVATAR_MUSETALK_ENDPOINT_URL ||
      process.env.AVATAR_DUIX_ENDPOINT_URL ||
      process.env.AVATAR_WAV2LIP_ENDPOINT_URL
  );
  return !envHosted;
}

/** Free long-form: one full-script voice + presenter package (no multi-clip stitch). */
async function processFreeLongFormAsSingle(job: AvatarJob): Promise<void> {
  const jobId = job.id;
  auditStage(jobId, "long_form_free_single", { reason: "freemium_presenter_no_gpu_stitch" });

  const fail = async (error: string) => {
    const outstanding = await getReservedTokensForJob(jobId);
    if (outstanding > 0) {
      await refundTokens(job.email, outstanding, jobId, `Long-form free path failed: ${error}`);
    }
    await updateJob(jobId, { status: "failed", error, tokensReserved: 0 });
  };

  try {
    await updateJob(jobId, { status: "generating_voice" });
    const voiceOutcome = await generateWithFailover("voice", job.voiceModelId, (modelId) =>
      generateVoice(modelId, job.script, job.qualityTier, job.voiceProfileId, job.email)
    );
    if (!voiceOutcome.result.ok) {
      await fail(voiceOutcome.result.error ?? "Voice generation failed");
      return;
    }

    await updateJob(jobId, { status: "generating_avatar" });
    const audioUrl = voiceOutcome.result.storageRef?.url ?? voiceOutcome.result.audioRef?.url ?? "";
    const avatarOutcome = await generateWithFailover("avatar", job.avatarModelId, (modelId) =>
      generateAvatarVideo(
        modelId,
        audioUrl,
        job.qualityTier,
        job.avatarProfileId,
        null,
        job.email,
        voiceOutcome.result.durationSeconds
      )
    );
    if (!avatarOutcome.result.ok) {
      await fail(avatarOutcome.result.error ?? "Presenter generation failed");
      return;
    }

    const avatarResult = avatarOutcome.result;
    const transcriptSource =
      avatarResult.audioRef?.url ?? voiceOutcome.result.audioRef?.url ?? avatarResult.storageRef?.url ?? null;
    const transcriptSegments = await generateTranscript(job.script, transcriptSource);
    const outputKind = avatarResult.outputKind ?? "presenter";

    // Mark all planned segments complete for UI progress honesty.
    const segments = (job.segments ?? []).map((s) => ({
      ...s,
      status: "complete" as const,
      voiceModelIdUsed: voiceOutcome.modelIdUsed,
      avatarModelIdUsed: avatarOutcome.modelIdUsed,
      audioRef: voiceOutcome.result.storageRef,
      videoRef: avatarResult.storageRef,
    }));

    await updateJob(jobId, {
      status: "complete",
      qaScore: 1,
      outputVideo: avatarResult.storageRef,
      outputAudio: avatarResult.audioRef ?? voiceOutcome.result.audioRef ?? null,
      outputPoster: avatarResult.posterRef ?? avatarResult.storageRef,
      outputKind,
      transcriptSegments,
      segments,
      completedAt: new Date().toISOString(),
      error: null,
    });
    auditStage(jobId, "long_form_free_complete", { outputKind });
  } catch (error) {
    await fail(error instanceof Error ? error.message : "Unexpected long-form free path error");
  }
}

export async function processLongFormJob(jobId: string): Promise<void> {
  const job = await getJobById(jobId);
  if (!job) return;
  if (["complete", "failed", "rejected"].includes(job.status)) return;
  if (!job.segments || job.segments.length === 0) {
    await updateJob(jobId, { status: "failed", error: "Long-form job has no planned segments" });
    return;
  }

  if (await isFreePresenterPath(job.email)) {
    return processFreeLongFormAsSingle(job);
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
      return;
    }

    const segment = segments[i]!;
    if (segment.status === "complete") continue;

    segments = segments.map((s, idx) => (idx === i ? { ...s, status: "generating_voice" as const } : s));
    await updateJob(jobId, { segments, status: "generating_voice" });

    const voiceOutcome = await generateWithFailover("voice", job.voiceModelId, (modelId) =>
      generateVoice(modelId, segment.text, job.qualityTier, job.voiceProfileId, job.email)
    );

    if (!voiceOutcome.result.ok || !voiceOutcome.modelIdUsed) {
      segments = segments.map((s, idx) =>
        idx === i
          ? { ...s, attemptedModels: [...s.attemptedModels, ...voiceOutcome.attemptedModels.map((m) => `voice:${m}`)] }
          : s
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

    segments = segments.map((s, idx) => (idx === i ? { ...s, status: "generating_avatar" as const } : s));
    await updateJob(jobId, { segments, status: "generating_avatar" });

    const audioUrl = segments[i]!.audioRef?.url ?? "";
    const framePassedIn = previousFrameUrl;
    const avatarOutcome = await generateWithFailover("avatar", job.avatarModelId, (modelId) =>
      generateAvatarVideo(
        modelId,
        audioUrl,
        job.qualityTier,
        job.avatarProfileId,
        framePassedIn,
        job.email,
        voiceOutcome.result.durationSeconds
      )
    );

    if (!avatarOutcome.result.ok || !avatarOutcome.modelIdUsed) {
      segments = segments.map((s, idx) =>
        idx === i
          ? { ...s, attemptedModels: [...s.attemptedModels, ...avatarOutcome.attemptedModels.map((m) => `avatar:${m}`)] }
          : s
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

    const clipVideoUrl = segments[i]!.videoRef?.url;
    if (i < segments.length - 1 && clipVideoUrl) {
      const frame = await extractLastFrame(clipVideoUrl, job.email);
      if (frame.ok) {
        segments = segments.map((s, idx) => (idx === i ? { ...s, lastFrameRef: frame.ref } : s));
        previousFrameUrl = frame.ref.url;
      } else {
        auditStage(jobId, "long_form_frame_extract_failed", { segmentIndex: i, error: frame.error });
        previousFrameUrl = null;
      }
    }

    segments = segments.map((s, idx) => (idx === i ? { ...s, status: "complete" as const } : s));
    await updateJob(jobId, { segments });
    auditStage(jobId, "long_form_segment_complete", { segmentIndex: i, of: totalSegments });
  }

  const clipUrls = segments.map((s) => s.videoRef?.url).filter((u): u is string => Boolean(u));
  const expectedMinutes = job.targetDurationMinutes ?? (totalSegments * DEFAULT_CLIP_SECONDS) / 60;
  const stitched = await stitchClips(clipUrls, job.email);

  if (!stitched.ok) {
    await failLongFormJob(
      job,
      segments,
      segments.length - 1,
      `All ${totalSegments} clips generated, but stitching them into one video failed: ${stitched.error}`
    );
    return;
  }

  const qa = evaluateOutput({
    voiceOk: true,
    avatarOk: true,
    durationSeconds: stitched.durationSeconds > 0 ? stitched.durationSeconds : null,
    expectedMinutes,
    softMode: false,
  });

  await updateJob(jobId, {
    status: "complete",
    qaScore: qa.score,
    outputVideo: stitched.ref,
    outputKind: "video",
    outputAudio: null,
    outputPoster: null,
    segments,
    completedAt: new Date().toISOString(),
    error: null,
  });
  auditStage(jobId, "long_form_complete", { totalSegments, qaScore: qa.score });
}
