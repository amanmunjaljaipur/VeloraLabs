import { auth } from "@/auth";
import {
  getSessionMeta,
  getSessionVideo,
  removeSessionVideo,
  setSessionVideo,
} from "@/lib/session-videos";
import { canAccessSessionVideo, isAdminRole } from "@/lib/session-access";
import { isValidYouTubeUrl } from "@/lib/youtube";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const updateSchema = z.object({
  youtubeUrl: z.string().min(1),
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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessSessionVideo(session.user.role, meta.audience)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const video = getSessionVideo(sessionId);
  const isAdmin = isAdminRole(session.user.role);

  if (!video && !isAdmin) {
    return NextResponse.json({ error: "Video not available" }, { status: 404 });
  }

  return NextResponse.json({
    meta,
    video: video
      ? { youtubeId: video.youtubeId, updatedAt: video.updatedAt }
      : null,
    isAdmin,
  });
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
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    if (!isValidYouTubeUrl(parsed.data.youtubeUrl)) {
      return NextResponse.json(
        {
          error:
            "Invalid YouTube URL. Paste a standard watch, youtu.be, embed, shorts, or live link.",
        },
        { status: 400 }
      );
    }

    const video = setSessionVideo(
      sessionId,
      parsed.data.youtubeUrl,
      session.user.email ?? "admin"
    );

    return NextResponse.json({
      success: true,
      video: {
        youtubeUrl: video.youtubeUrl,
        youtubeId: video.youtubeId,
        updatedAt: video.updatedAt,
      },
    });
  } catch (error) {
    console.error("Failed to save session video:", error);

    if (error instanceof Error) {
      if (error.message === "Invalid YouTube URL") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("EROFS") || error.message.includes("read-only")) {
        return NextResponse.json(
          { error: "Video storage is read-only in this environment." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Could not save video link. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const meta = getSessionMeta(sessionId);
  if (!meta) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const removed = removeSessionVideo(sessionId);
  if (!removed) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}