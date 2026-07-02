import { auth } from "@/auth";
import { getAllSessionMetas, getAllSessionVideos } from "@/lib/session-videos";
import { isAdminRole } from "@/lib/session-access";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const videos = getAllSessionVideos();
  const sessions = getAllSessionMetas().map((meta) => ({
    ...meta,
    hasVideo: !!videos[meta.id],
    video: videos[meta.id] ?? null,
  }));

  return NextResponse.json({ sessions });
}