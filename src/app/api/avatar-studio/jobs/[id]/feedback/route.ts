import { auth } from "@/auth";
import { getJob } from "@/lib/avatar-studio/jobs-store";
import { recordFeedback } from "@/lib/avatar-studio/agents/feedback-agent";
import type { CorrectionType } from "@/lib/avatar-studio/feedback-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CORRECTION_TYPES = new Set<CorrectionType>(["transcript_edit", "regenerate", "thumbs_up", "thumbs_down", "manual_note"]);

/** Logs a correction/rating against a job - feeds the daily training pool if the user has training_data consent (checked inside feedback-store, snapshotted at write time). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await getJob(id, session.user.email);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const correctionType = body?.correctionType;
  if (!CORRECTION_TYPES.has(correctionType)) {
    return NextResponse.json({ error: "Invalid correctionType" }, { status: 400 });
  }

  const modelId = typeof body?.modelId === "string" && body.modelId ? body.modelId : job.avatarModelId;
  const entry = await recordFeedback({
    email: session.user.email,
    jobId: job.id,
    modelId,
    categoryId: job.categoryId,
    correctionType,
    original: typeof body?.original === "string" ? body.original : null,
    corrected: typeof body?.corrected === "string" ? body.corrected : null,
    note: typeof body?.note === "string" ? body.note : null,
  });

  return NextResponse.json({ feedback: entry }, { status: 201 });
}
