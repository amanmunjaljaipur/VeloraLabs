import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { setTrainingPaused } from "@/lib/avatar-studio/training-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session?.user?.email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (typeof body?.paused !== "boolean") {
    return NextResponse.json({ error: "paused (boolean) is required" }, { status: 400 });
  }

  const settings = await setTrainingPaused(body.paused, session.user.email);
  return NextResponse.json({ settings });
}
