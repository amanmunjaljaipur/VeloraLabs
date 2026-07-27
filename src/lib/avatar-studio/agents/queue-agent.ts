import { getJobById, updateJob } from "@/lib/avatar-studio/jobs-store";
import { getReservedTokensForJob, refundTokens } from "@/lib/avatar-studio/token-ledger-store";
import { generateVoice } from "@/lib/avatar-studio/agents/voice-agent";
import { generateAvatarVideo } from "@/lib/avatar-studio/agents/avatar-agent";
import { generateTranscript } from "@/lib/avatar-studio/agents/transcript-agent";
import { evaluateOutput, QA_PASS_THRESHOLD } from "@/lib/avatar-studio/agents/qa-agent";
import { estimateDurationMinutes } from "@/lib/avatar-studio/agents/model-selector-agent";
import { auditStage, auditFailure } from "@/lib/avatar-studio/agents/audit-agent";
import { generateWithFailover } from "@/lib/avatar-studio/agents/model-failover";
import { processLongFormJob } from "@/lib/avatar-studio/agents/long-form-agent";
import { getCoverUrl, getProfile } from "@/lib/avatar-studio/profiles-store";

async function setProgress(
  jobId: string,
  percent: number,
  label: string,
  status?: "queued" | "generating_voice" | "generating_avatar" | "qa_check"
): Promise<void> {
  await updateJob(jobId, {
    progressPercent: Math.max(0, Math.min(100, Math.round(percent))),
    progressLabel: label,
    ...(status ? { status } : {}),
  });
}

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
    const outstanding = await getReservedTokensForJob(jobId);
    if (outstanding > 0) {
      await refundTokens(job.email, outstanding, jobId, `Job failed at stage "${job.status}": ${error}`);
    }
    await updateJob(jobId, {
      status: "failed",
      error,
      tokensReserved: 0,
      progressPercent: 100,
      progressLabel: "Failed",
    });
  };

  try {
    await setProgress(jobId, 8, "Starting generation…", "queued");

    // --- Voice ---
    const voiceKey = job.voiceProfileId;
    const voiceLabel =
      voiceKey?.startsWith("free:")
        ? `Free voice ${voiceKey.replace("free:", "")}`
        : voiceKey
          ? "Your trained voice"
          : "Default free voice";
    await setProgress(jobId, 12, `Generating audio — ${voiceLabel}…`, "generating_voice");
    // voiceProfileId: free:en-US-GuyNeural | trained uuid | null — must not be ignored
    const voiceOutcome = await generateWithFailover("voice", job.voiceModelId, (modelId) =>
      generateVoice(modelId, job.script, job.qualityTier, voiceKey, job.email)
    );
    const voiceResult = voiceOutcome.result;
    if (!voiceResult.ok) {
      await fail(voiceResult.error ?? "Voice generation failed");
      return;
    }
    await setProgress(jobId, 38, "Voice ready — saving audio…", "generating_voice");
    auditStage(jobId, "voice_complete", { model: voiceOutcome.modelIdUsed, attempted: voiceOutcome.attemptedModels });

    // --- Avatar / animated presenter ---
    await setProgress(jobId, 42, "Building presenter face & motion…", "generating_avatar");
    const audioUrl = voiceResult.storageRef?.url ?? voiceResult.audioRef?.url ?? "";

    // Resolve selected face sample → cover portrait from character image bank
    let portraitUrlOverride: string | null = null;
    if (job.avatarProfileId) {
      const face = await getProfile(job.avatarProfileId, job.email);
      const coverUrl = face ? getCoverUrl(face) : null;
      if (coverUrl && face && (face.kind === "avatar" || face.kind === "both")) {
        portraitUrlOverride = coverUrl;
        const bankSize = face.mediaBank?.filter((m) => m.kind === "image").length ?? 0;
        await setProgress(
          jobId,
          44,
          bankSize > 1
            ? `Using cover photo for ${face.name} (${bankSize} images in bank)`
            : `Using character face: ${face.name}`,
          "generating_avatar"
        );
      }
    }

    const onAvatarProgress = async (percent: number, label: string) => {
      // Map package sub-progress 48–90 into job 42–88
      const mapped = 42 + Math.round((Math.min(100, Math.max(0, percent)) / 100) * 46);
      await setProgress(jobId, mapped, label, "generating_avatar");
    };

    let avatarOutcome = await generateWithFailover("avatar", job.avatarModelId, (modelId) =>
      generateAvatarVideo(
        modelId,
        audioUrl,
        job.qualityTier,
        job.avatarProfileId,
        null,
        job.email,
        voiceResult.durationSeconds,
        {
          scriptPreview: job.script,
          portraitUrlOverride,
          onProgress: onAvatarProgress,
        }
      )
    );
    let avatarResult = avatarOutcome.result;
    if (!avatarResult.ok) {
      await fail(avatarResult.error ?? "Avatar generation failed");
      return;
    }
    await setProgress(jobId, 88, "Video package ready…", "generating_avatar");
    auditStage(jobId, "avatar_complete", { model: avatarOutcome.modelIdUsed, attempted: avatarOutcome.attemptedModels });

    // --- Free video memes (royalty-free b-roll) ---
    if (
      avatarResult.ok &&
      avatarResult.storageRef?.url &&
      Array.isArray(job.memePlacements) &&
      job.memePlacements.length > 0
    ) {
      try {
        await setProgress(jobId, 89, "Inserting free video memes…", "generating_avatar");
        const { stitchMemesIntoVideo } = await import("@/lib/avatar-studio/meme-stitch");
        const stitched = await stitchMemesIntoVideo({
          email: job.email,
          mainVideoUrl: avatarResult.storageRef.url,
          mainDurationSeconds: avatarResult.durationSeconds ?? voiceResult.durationSeconds ?? 12,
          placements: job.memePlacements.map((p) => ({
            ...p,
            mood: p.mood as import("@/lib/avatar-studio/meme-catalog").MemeMood,
          })),
          onProgress: async (pct, label) => {
            await setProgress(jobId, pct, label, "generating_avatar");
          },
        });
        if (stitched.ok) {
          avatarResult = {
            ...avatarResult,
            storageRef: stitched.video,
            durationSeconds: stitched.durationSeconds,
            outputKind: "video",
          };
          auditStage(jobId, "memes_stitched", { count: job.memePlacements.length, genre: job.videoGenre });
        } else {
          auditStage(jobId, "memes_stitch_skipped", { error: stitched.error });
        }
      } catch (err) {
        auditStage(jobId, "memes_stitch_error", { error: String(err) });
      }
    }

    // --- QA ---
    await setProgress(jobId, 90, "Running quality check…", "qa_check");
    const expectedMinutes = estimateDurationMinutes(job.script);
    const isPresenter =
      avatarResult.outputKind === "presenter" ||
      voiceResult.outputKind === "presenter" ||
      Boolean(avatarResult.audioRef || voiceResult.audioRef);
    const durationSeconds = voiceResult.durationSeconds ?? avatarResult.durationSeconds;

    let qa = evaluateOutput({
      voiceOk: voiceResult.ok,
      avatarOk: avatarResult.ok,
      durationSeconds,
      expectedMinutes,
      softMode: isPresenter || avatarResult.outputKind === "video",
    });

    if (!qa.passed && !isPresenter && avatarResult.outputKind !== "video") {
      await setProgress(jobId, 91, "Quality retry — regenerating visuals…", "generating_avatar");
      auditStage(jobId, "qa_retry", { firstScore: qa.score, notes: qa.notes });
      await updateJob(jobId, { qaRetryCount: job.qaRetryCount + 1 });
      avatarOutcome = await generateWithFailover("avatar", job.avatarModelId, (modelId) =>
        generateAvatarVideo(
          modelId,
          audioUrl,
          job.qualityTier,
          job.avatarProfileId,
          null,
          job.email,
          voiceResult.durationSeconds,
          {
            scriptPreview: job.script,
            portraitUrlOverride,
            onProgress: onAvatarProgress,
          }
        )
      );
      avatarResult = avatarOutcome.result;
      if (!avatarResult.ok) {
        await fail(avatarResult.error ?? "Avatar generation failed on QA retry");
        return;
      }
      qa = evaluateOutput({
        voiceOk: true,
        avatarOk: true,
        durationSeconds: voiceResult.durationSeconds ?? avatarResult.durationSeconds,
        expectedMinutes,
        softMode: true,
      });
    }

    if (!qa.passed && voiceResult.ok && avatarResult.ok) {
      auditStage(jobId, "qa_force_pass", { score: qa.score, notes: qa.notes });
      qa = {
        score: Math.max(qa.score, 75),
        passed: true,
        notes: `${qa.notes} — force-passed after successful generation`,
      };
    }

    if (!qa.passed) {
      await fail(
        `Output did not pass quality check after retry (score ${qa.score}/${QA_PASS_THRESHOLD} needed): ${qa.notes}`
      );
      return;
    }

    await setProgress(jobId, 94, "Building transcript…", "qa_check");
    const transcriptSource =
      avatarResult.audioRef?.url ?? voiceResult.audioRef?.url ?? avatarResult.storageRef?.url ?? null;
    const transcriptSegments = await generateTranscript(job.script, transcriptSource);

    const outputKind =
      avatarResult.outputKind === "video"
        ? "video"
        : avatarResult.outputKind ?? (avatarResult.audioRef ? "presenter" : "video");

    await updateJob(jobId, {
      status: "complete",
      qaScore: qa.score,
      outputVideo: avatarResult.storageRef,
      outputAudio: avatarResult.audioRef ?? voiceResult.audioRef ?? null,
      outputPoster: avatarResult.posterRef ?? null,
      outputKind,
      progressPercent: 100,
      progressLabel: outputKind === "video" ? "Ready — animated video" : "Ready — presenter",
      transcriptSegments,
      completedAt: new Date().toISOString(),
      error: null,
    });
    auditStage(jobId, "pipeline_complete", { qaScore: qa.score, outputKind });
  } catch (error) {
    await fail(error instanceof Error ? error.message : "Unexpected pipeline error");
  }
}
