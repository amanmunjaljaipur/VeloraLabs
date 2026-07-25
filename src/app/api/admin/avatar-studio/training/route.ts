import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { getTrainingSettings, listTrainingBatches } from "@/lib/avatar-studio/training-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Super Admin only - training must stay in the platform owner's control (explicit requirement). */
export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [settings, batches] = await Promise.all([getTrainingSettings(), listTrainingBatches(100)]);
  return NextResponse.json({ settings, batches });
}
