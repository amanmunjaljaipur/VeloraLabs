import { auth } from "@/auth";
import { getJob, updateJob } from "@/lib/avatar-studio/jobs-store";
import { refundTokens } from "@/lib/avatar-studio/token-ledger-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TERMINAL = new Set(["complete", "failed", "rejected"]);

/**
 * "Cancel" here means: stop waiting on it and refund any reserved tokens.
 * This scaffold has no way to truly interrupt a live GPU inference call
 * mid-flight, so a job already generating is marked failed/refunded rather
 * than surgically stopped - an honest limitation, not a silent gap.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await getJob(id, session.user.email);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (TERMINAL.has(job.status)) {
    return NextResponse.json({ error: "Job has already finished and can't be cancelled" }, { status: 400 });
  }

  if (job.tokensReserved > 0) {
    await refundTokens(job.email, job.tokensReserved, job.id, "Cancelled by user");
  }
  const updated = await updateJob(id, { status: "failed", error: "Cancelled by user", tokensReserved: 0 });

  return NextResponse.json({ job: updated });
}
