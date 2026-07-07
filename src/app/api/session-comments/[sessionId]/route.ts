import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import {
  canAccessSessionVideo,
  isAdminRole,
  isLearnerRole,
} from "@/lib/session-access";
import { getSessionMeta } from "@/lib/session-videos";
import { addVideoComment, getCommentsForSession } from "@/lib/video-comments";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const COMMENT_LIMIT = 8;
const COMMENT_WINDOW_MS = 15 * 60 * 1000;

const postSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(2000),
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
  if (!isAdmin && !canAccessSessionVideo(session.user.role, meta.audience)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comments = getCommentsForSession(sessionId);
  const canComment =
    !isAdmin && isLearnerRole(session.user.role) && canAccessSessionVideo(session.user.role, meta.audience);

  return NextResponse.json({
    comments,
    canComment,
    viewerEmail: session.user.email,
    isAdmin,
  });
}

export async function POST(
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

  const role = session.user.role;
  if (!role || !isLearnerRole(role)) {
    return NextResponse.json(
      { error: "Only enrolled learners can post comments" },
      { status: 403 }
    );
  }

  if (!canAccessSessionVideo(role, meta.audience)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rateKey = `comment:${session.user.email}:${sessionId}:${ip}`;
  const rateLimit = checkRateLimit(rateKey, COMMENT_LIMIT, COMMENT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many comments. Please wait a few minutes and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec ?? 60) },
      }
    );
  }

  try {
    const body = postSchema.parse(await req.json());
    const comment = addVideoComment({
      sessionId,
      email: session.user.email,
      authorName: session.user.name ?? session.user.email,
      role,
      body: body.body,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid comment" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Could not post comment" }, { status: 500 });
  }
}