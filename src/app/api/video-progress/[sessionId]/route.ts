import { auth } from "@/auth";
import { isDayCompleted, markDayComplete } from "@/lib/course-progress";
import { getCourseTrack } from "@/lib/content";
import { getSessionMeta } from "@/lib/session-videos";
import { canAccessSession } from "@/lib/session-access-grants";
import { isAdminRole } from "@/lib/session-access";
import { getVideoProgress, setVideoProgress } from "@/lib/video-progress";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const updateSchema = z.object({
  watchedSeconds: z.number().min(0),
  durationSeconds: z.number().min(0),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const meta = getSessionMeta(sessionId);
  if (!meta) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = isAdminRole(session.user.role);
  if (!isAdmin && !canAccessSession(session.user.email, session.user.role, sessionId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const progress = getVideoProgress(session.user.email, sessionId);
  return NextResponse.json({ progress });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const meta = getSessionMeta(sessionId);
  if (!meta) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = isAdminRole(session.user.role);
  if (!isAdmin && !canAccessSession(session.user.email, session.user.role, sessionId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid progress data" }, { status: 400 });
    }

    const dayAlreadyComplete = isDayCompleted(session.user.email, meta.day);
    if (dayAlreadyComplete) {
      const existing = getVideoProgress(session.user.email, sessionId);
      return NextResponse.json({ success: true, progress: existing, reviewMode: true });
    }

    const progress = setVideoProgress(
      session.user.email,
      sessionId,
      parsed.data.watchedSeconds,
      parsed.data.durationSeconds
    );

    if (!isAdmin && progress.percent >= 90) {
      const course = getCourseTrack(meta.audience);
      const validDays = course.phases.flatMap((phase) => phase.days.map((day) => day.day));
      markDayComplete(session.user.email, meta.audience, meta.day, validDays);
    }

    return NextResponse.json({ success: true, progress });
  } catch {
    return NextResponse.json({ error: "Could not save progress" }, { status: 500 });
  }
}