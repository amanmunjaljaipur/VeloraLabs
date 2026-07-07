import { auth } from "@/auth";
import { getSessionMeta } from "@/lib/session-videos";
import { isAdminRole } from "@/lib/session-access";
import {
  deleteVideoComment,
  getAllVideoComments,
  type VideoComment,
} from "@/lib/video-comments";
import { ROLE_LABELS } from "@/types/roles";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export interface AdminVideoCommentRow extends VideoComment {
  sessionTitle: string;
  sessionDay: number;
  sessionAudience: string;
  roleLabel: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows: AdminVideoCommentRow[] = getAllVideoComments().map((comment) => {
    const meta = getSessionMeta(comment.sessionId);
    return {
      ...comment,
      sessionTitle: meta?.title ?? "Unknown session",
      sessionDay: meta?.day ?? 0,
      sessionAudience: meta?.audience ?? "unknown",
      roleLabel: ROLE_LABELS[comment.role] ?? comment.role,
    };
  });

  return NextResponse.json({ comments: rows, total: rows.length });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const commentId = req.nextUrl.searchParams.get("id");
  if (!commentId) {
    return NextResponse.json({ error: "Comment id required" }, { status: 400 });
  }

  const removed = deleteVideoComment(commentId);
  if (!removed) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}