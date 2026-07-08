import { auth } from "@/auth";
import {
  getSessionDocuments,
  removeSessionDocument,
  updateSessionDocument,
  type SessionDocumentType,
} from "@/lib/session-documents";
import { isAdminRole } from "@/lib/session-access";
import { getSessionMeta } from "@/lib/session-videos";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  adminUrl: z.string().url().optional(),
  learnerUrl: z.string().url().optional(),
  type: z.enum(["pdf", "doc", "slides", "link"]).optional(),
  summary: z.string().optional(),
  visibleToLearners: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string; documentId: string }> }
) {
  const { sessionId, documentId } = await params;
  const meta = getSessionMeta(sessionId);
  if (!meta) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = updateSchema.parse(await req.json());
    const document = updateSessionDocument(sessionId, documentId, parsed, session.user.email ?? "admin");
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, document, documents: getSessionDocuments(sessionId) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid document update" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update document" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string; documentId: string }> }
) {
  const { sessionId, documentId } = await params;
  const meta = getSessionMeta(sessionId);
  if (!meta) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const removed = removeSessionDocument(sessionId, documentId);
  if (!removed) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, documents: getSessionDocuments(sessionId) });
}