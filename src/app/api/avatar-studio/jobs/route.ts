import { auth } from "@/auth";
import { listJobsForUser, createJob, updateJob, type JobMode } from "@/lib/avatar-studio/jobs-store";
import { enrichScript } from "@/lib/avatar-studio/agents/enrichment-agent";
import { moderateScript } from "@/lib/avatar-studio/agents/moderation-agent";
import { logModeration } from "@/lib/avatar-studio/moderation-log-store";
import { estimateJobCost, checkAndReserveTokens } from "@/lib/avatar-studio/agents/model-selector-agent";
import { hasCurrentConsent } from "@/lib/avatar-studio/consent-store";
import { processJob } from "@/lib/avatar-studio/agents/queue-agent";
import { planSegments } from "@/lib/avatar-studio/agents/long-form-agent";
import { logError } from "@/lib/diagnostics/log-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import type { QualityTier } from "@/lib/avatar-studio/model-catalog";

export const runtime = "nodejs";
export const maxDuration = 60;

const QUALITY_TIERS = new Set<QualityTier>(["standard", "high", "best"]);
const JOB_MODES = new Set<JobMode>(["single", "long_form"]);
const MIN_LONG_FORM_MINUTES = 1;
const MAX_LONG_FORM_MINUTES = 30;

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await listJobsForUser(session.user.email);
  return NextResponse.json({ jobs });
}

/**
 * Creates a render job. Moderation and token-affordability run HERE,
 * synchronously, before anything is queued or charged - a script that fails
 * moderation or that the user can't afford never becomes a job record at
 * all (matches the spec's "Moderation Agent screens before GPU time is
 * spent" ordering). Once accepted, the job is created already paid-for
 * (tokens reserved against it) and handed to the Queue Agent, which does the
 * actual Voice -> Avatar -> QA -> Transcript work asynchronously.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  const ip = getClientIp(req);
  const rate = checkRateLimit(`avatar-job-create:${email}:${ip}`, 15, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many jobs submitted, please try again later" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
  const script = typeof body?.script === "string" ? body.script.trim() : "";
  const voiceModelId = typeof body?.voiceModelId === "string" ? body.voiceModelId : "";
  const avatarModelId = typeof body?.avatarModelId === "string" ? body.avatarModelId : "";
  const qualityTier = QUALITY_TIERS.has(body?.qualityTier) ? (body.qualityTier as QualityTier) : null;
  const avatarProfileId = typeof body?.avatarProfileId === "string" && body.avatarProfileId ? body.avatarProfileId : null;
  const voiceProfileId = typeof body?.voiceProfileId === "string" && body.voiceProfileId ? body.voiceProfileId : null;
  const castProfileIds = Array.isArray(body?.castProfileIds)
    ? body.castProfileIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0).slice(0, 20)
    : [];
  const mode = JOB_MODES.has(body?.mode) ? (body.mode as JobMode) : "single";
  const targetDurationMinutes =
    mode === "long_form" && typeof body?.targetDurationMinutes === "number" && Number.isFinite(body.targetDurationMinutes)
      ? Math.min(MAX_LONG_FORM_MINUTES, Math.max(MIN_LONG_FORM_MINUTES, Math.round(body.targetDurationMinutes)))
      : null;

  // Free video memes (script-aware placements)
  const videoGenre = typeof body?.videoGenre === "string" ? body.videoGenre.slice(0, 40) : null;
  const memePlacementsRaw = Array.isArray(body?.memePlacements) ? body.memePlacements : [];
  const memePlacements =
    memePlacementsRaw.length > 0
      ? memePlacementsRaw
          .slice(0, 5)
          .map((p: Record<string, unknown>) => ({
            placementId: typeof p.placementId === "string" ? p.placementId : `p-${Math.random()}`,
            clipId: typeof p.clipId === "string" ? p.clipId : "",
            positionRatio:
              typeof p.positionRatio === "number" && Number.isFinite(p.positionRatio)
                ? Math.min(0.95, Math.max(0.05, p.positionRatio))
                : 0.5,
            scriptSnippet: typeof p.scriptSnippet === "string" ? p.scriptSnippet.slice(0, 200) : "",
            label: typeof p.label === "string" ? p.label.slice(0, 120) : "Meme insert",
            mood: typeof p.mood === "string" ? p.mood.slice(0, 40) : "transition",
            sourceUrl: typeof p.sourceUrl === "string" ? p.sourceUrl : undefined,
          }))
          .filter((p: { clipId: string }) => Boolean(p.clipId))
      : null;

  if (!categoryId || !script || !voiceModelId || !avatarModelId || !qualityTier) {
    return NextResponse.json(
      { error: "categoryId, script, voiceModelId, avatarModelId, and qualityTier are required" },
      { status: 400 }
    );
  }
  if (script.length > 20_000) {
    return NextResponse.json({ error: "Script is too long (max ~20,000 characters)" }, { status: 400 });
  }
  if (mode === "long_form" && !targetDurationMinutes) {
    return NextResponse.json({ error: "targetDurationMinutes is required for long_form jobs" }, { status: 400 });
  }

  // Trained samples (real UUIDs) need consent. free:… system voices do not.
  const needsCloneConsent =
    Boolean(avatarProfileId) ||
    Boolean(voiceProfileId && !voiceProfileId.startsWith("free:")) ||
    castProfileIds.some((id: string) => !id.startsWith("free:"));
  if (needsCloneConsent) {
    const consented = await hasCurrentConsent(email, "voice_face_clone");
    if (!consented) {
      return NextResponse.json({ error: "consent_required", detail: "Voice/face cloning consent is required to use a clone profile" }, { status: 403 });
    }
  }

  const enriched = await enrichScript(categoryId, script);
  if (!enriched.ok) return NextResponse.json({ error: enriched.error }, { status: 400 });

  const moderation = await moderateScript(enriched.result.script, enriched.result.moderationLevel);
  void logModeration({
    email,
    categoryId,
    moderationLevel: enriched.result.moderationLevel,
    script: enriched.result.script,
    approved: moderation.approved,
    reason: moderation.reason,
    flaggedTerms: moderation.flaggedTerms,
  });
  if (!moderation.approved) {
    return NextResponse.json(
      { error: "moderation_rejected", reason: moderation.reason, flaggedTerms: moderation.flaggedTerms },
      { status: 422 }
    );
  }

  const costEstimate = await estimateJobCost(voiceModelId, avatarModelId, qualityTier, enriched.result.script);
  if (!costEstimate.ok) return NextResponse.json({ error: costEstimate.error }, { status: 400 });

  // Long-form: chunk the (already-final) script into clip-sized segments up
  // front, sized to the chosen avatar model's max single-clip length -
  // these get chained via last-frame continuity and stitched once every
  // segment is rendered (long-form-agent.ts).
  const segments = mode === "long_form" ? await planSegments(enriched.result.script, avatarModelId) : null;
  if (mode === "long_form" && (!segments || segments.length === 0)) {
    return NextResponse.json({ error: "Could not plan any segments from this script" }, { status: 400 });
  }

  const job = await createJob({
    email,
    categoryId,
    script: enriched.result.script,
    voiceModelId,
    avatarModelId,
    qualityTier,
    avatarProfileId,
    voiceProfileId,
    castProfileIds: Array.from(
      new Set([
        ...castProfileIds,
        ...(avatarProfileId ? [avatarProfileId] : []),
        ...(voiceProfileId ? [voiceProfileId] : []),
      ])
    ),
    tokensReserved: 0,
    mode,
    targetDurationMinutes,
    segments,
    memePlacements,
    videoGenre,
  });

  const reservation = await checkAndReserveTokens(email, job.id, voiceModelId, avatarModelId, qualityTier, costEstimate.estimate);
  if (!reservation.ok) {
    await updateJob(job.id, { status: "failed", error: reservation.error });
    return NextResponse.json({ error: reservation.error, fallback: reservation.fallback, jobId: job.id }, { status: 402 });
  }

  const finalJob = await updateJob(job.id, { tokensReserved: costEstimate.estimate.tokens });

  try {
    after(() => processJob(job.id).catch((error) => void logError("avatar-studio/jobs-route", "processJob threw", { jobId: job.id, error: String(error) })));
  } catch {
    void processJob(job.id).catch((error) => void logError("avatar-studio/jobs-route", "processJob threw", { jobId: job.id, error: String(error) }));
  }

  return NextResponse.json({ job: finalJob ?? job }, { status: 201 });
}
