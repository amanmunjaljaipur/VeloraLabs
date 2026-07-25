import { auth } from "@/auth";
import { disconnectDrive } from "@/lib/avatar-studio/storage-connections-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Disconnects Drive going forward - does not touch files already uploaded there, and does not migrate them back to Blob (matches Google's own revoke semantics: existing files stay put, only new uploads go to Blob after this). */
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await disconnectDrive(session.user.email);
  return NextResponse.json({ success: true });
}
