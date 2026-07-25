import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { listModerationLog } from "@/lib/avatar-studio/moderation-log-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entries = await listModerationLog(150);
  return NextResponse.json({ entries });
}
