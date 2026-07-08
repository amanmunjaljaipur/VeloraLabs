import { auth } from "@/auth";
import {
  getSessionDocument,
  removeSessionDocument,
  setSessionDocument,
  type SessionDocumentType,
} from "@/lib/session-documents";
import { canAccessSession } from "@/lib/session-access-grants";
import { isAdminRole } from "@/lib/session-access";
import { getSessionMeta } from "@/lib/session-videos";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const updateSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  type: z.enum(["pdf", "doc", "slides", "link"]).default("link"),
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

  if (!canAccessSession(session.user.email, session.user.role, sessionId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const document = getSessionDocument(sessionId);
  const isAdmin = isAdminRole(session.user.role);

  if (!document && !isAdmin) {
    return NextResponse.json({ error: "Document not available" }, { status: 404 });
  }

  return NextResponse.json({
    meta,
    document,
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
      return NextResponse.json({ error: "Title and document URL are required" }, { status: 400 });
    }

    const document = setSessionDocument(
      sessionId,
      {
        title: parsed.data.title,
        url: parsed.data.url,
        type: parsed.data.type as SessionDocumentType,
      },
      session.user.email ?? "admin"
    );

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Failed to save session document:", error);
    return NextResponse.json(
      { error: "Could not save training document. Please try again." },
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

  const removed = removeSessionDocument(sessionId);
  if (!removed) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}