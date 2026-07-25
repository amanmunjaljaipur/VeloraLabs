import { auth } from "@/auth";
import { deleteProfile } from "@/lib/avatar-studio/profiles-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteProfile(id, session.user.email);
  if (!ok) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
