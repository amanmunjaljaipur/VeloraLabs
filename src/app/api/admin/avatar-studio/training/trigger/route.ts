import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { runTrainingCycle } from "@/lib/avatar-studio/agents/training-agent";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 45;

/** Manually runs a training cycle right now, instead of waiting for the daily cron. Still honors the pause flag. */
export async function POST() {
  const session = await requireSuperAdmin();
  if (!session?.user?.email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const batch = await runTrainingCycle("manual", session.user.email);
  return NextResponse.json({ batch });
}
