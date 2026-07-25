import { auth } from "@/auth";
import { getJob, updateJob, type TranscriptSegment } from "@/lib/avatar-studio/jobs-store";
import { recordFeedback } from "@/lib/avatar-studio/agents/feedback-agent";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isSegment(value: unknown): value is TranscriptSegment {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.startMs === "number" &&
    typeof s.endMs === "number" &&
    typeof s.text === "string" &&
    typeof s.dirty === "boolean"
  );
}

/**
 * Powers the transcript-based editor (Section 8): saves edited segments and
 * logs the edit as feedback (continuous logging, Section 7) so it can feed
 * the daily training pool if the user has opted in. Only editable once a
 * job has actually produced a transcript.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await getJob(id, session.user.email);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.status !== "complete" || !job.transcriptSegments) {
    return NextResponse.json({ error: "This job has no transcript to edit yet" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const segments = Array.isArray(body?.segments) ? body.segments : null;
  if (!segments || !segments.every(isSegment)) {
    return NextResponse.json({ error: "segments must be a valid TranscriptSegment[]" }, { status: 400 });
  }

  const originalText = job.transcriptSegments.map((s) => s.text).join(" ");
  const updated = await updateJob(id, { transcriptSegments: segments });
  const changedCount = segments.filter((s: TranscriptSegment) => s.dirty).length;

  if (changedCount > 0) {
    await recordFeedback({
      email: session.user.email,
      jobId: job.id,
      modelId: job.avatarModelId,
      categoryId: job.categoryId,
      correctionType: "transcript_edit",
      original: originalText.slice(0, 4000),
      corrected: segments.map((s: TranscriptSegment) => s.text).join(" ").slice(0, 4000),
      note: `${changedCount} segment(s) edited`,
    });
  }

  return NextResponse.json({ job: updated });
}
