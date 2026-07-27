import { auth } from "@/auth";
import { processJob } from "@/lib/avatar-studio/agents/queue-agent";
import { hasCurrentConsent } from "@/lib/avatar-studio/consent-store";
import { getJob, updateJob } from "@/lib/avatar-studio/jobs-store";
import { isFreeVoiceId } from "@/lib/avatar-studio/free-voices";
import { getProfile } from "@/lib/avatar-studio/profiles-store";
import { logError } from "@/lib/diagnostics/log-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { after, NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Re-generate a completed job's full voice + presenter package with a new voice.
 * Does not change script, face, or memes; does not charge tokens again.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  const { id } = await params;
  const job = await getJob(id, email);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  if (!["complete", "failed"].includes(job.status)) {
    return NextResponse.json(
      { error: "Job is still generating — wait until it finishes before changing voice" },
      { status: 409 }
    );
  }

  if (!job.script?.trim()) {
    return NextResponse.json({ error: "Job has no script to re-voice" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit(`avatar-job-revoice:${email}:${ip}`, 20, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many re-voice requests — try again later" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const voiceProfileId =
    typeof body?.voiceProfileId === "string" && body.voiceProfileId.trim()
      ? body.voiceProfileId.trim()
      : null;

  if (!voiceProfileId) {
    return NextResponse.json({ error: "voiceProfileId is required" }, { status: 400 });
  }

  // Validate free catalogue vs trained profile
  if (isFreeVoiceId(voiceProfileId)) {
    // ok
  } else {
    const profile = await getProfile(voiceProfileId, email);
    if (!profile) {
      return NextResponse.json({ error: "Voice profile not found" }, { status: 404 });
    }
    if (profile.kind === "avatar") {
      return NextResponse.json({ error: "That profile is face-only — pick a voice sample" }, { status: 400 });
    }
    const consented = await hasCurrentConsent(email, "voice_face_clone");
    if (!consented) {
      return NextResponse.json(
        { error: "consent_required", detail: "Grant voice/face consent on Train before using a trained voice" },
        { status: 403 }
      );
    }
  }

  // Reset multi-clip segments so long-form regenerates with the new voice
  const segments =
    job.mode === "long_form" && Array.isArray(job.segments)
      ? job.segments.map((s) => ({
          ...s,
          status: "pending" as const,
          voiceModelIdUsed: null,
          avatarModelIdUsed: null,
          audioRef: null,
          videoRef: null,
          lastFrameRef: null,
          attemptedModels: [] as string[],
          error: null,
        }))
      : job.segments;

  const cast = Array.from(
    new Set([
      ...(job.castProfileIds ?? []),
      voiceProfileId,
      ...(job.avatarProfileId ? [job.avatarProfileId] : []),
    ])
  );

  const updated = await updateJob(id, {
    voiceProfileId,
    castProfileIds: cast,
    status: "queued",
    error: null,
    qaScore: null,
    qaRetryCount: 0,
    progressPercent: 5,
    progressLabel: "Re-voicing with your selected voice…",
    completedAt: null,
    segments,
    // Keep previous media URLs until the pipeline overwrites them so the player
    // can still show the last version while regenerating.
  });

  try {
    after(() =>
      processJob(id).catch((error) =>
        void logError("avatar-studio/jobs-revoice", "processJob threw", {
          jobId: id,
          error: String(error),
        })
      )
    );
  } catch {
    void processJob(id).catch((error) =>
      void logError("avatar-studio/jobs-revoice", "processJob threw", {
        jobId: id,
        error: String(error),
      })
    );
  }

  return NextResponse.json({ job: updated, note: "Voice update started — full audio will regenerate" });
}
