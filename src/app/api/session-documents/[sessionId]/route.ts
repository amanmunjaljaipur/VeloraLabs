import { auth } from "@/auth";
import {
  addSessionDocument,
  getSessionDocuments,
  type SessionDocumentType,
} from "@/lib/session-documents";
import { canAccessSession } from "@/lib/session-access-grants";
import { isAdminRole } from "@/lib/session-access";
import { getSessionMeta } from "@/lib/session-videos";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().min(1),
  adminUrl: z.string().url(),
  learnerUrl: z.string().url().optional(),
  type: z.enum(["pdf", "doc", "slides", "link"]).optional(),
  summary: z.string().optional(),
  visibleToLearners: z.boolean().optional(),
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

  const isAdmin = isAdminRole(session.user.role);
  if (!isAdmin && !canAccessSession(session.user.email, session.user.role, sessionId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const documents = getSessionDocuments(sessionId, { learnersOnly: !isAdmin });

  return NextResponse.json({
    meta,
    documents,
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
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = createSchema.parse(await req.json());
    const document = addSessionDocument(
      sessionId,
      {
        title: parsed.title,
        adminUrl: parsed.adminUrl,
        learnerUrl: parsed.learnerUrl,
        type: parsed.type as SessionDocumentType | undefined,
        summary: parsed.summary,
        visibleToLearners: parsed.visibleToLearners,
      },
      session.user.email ?? "admin"
    );

    return NextResponse.json({ success: true, document, documents: getSessionDocuments(sessionId) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Title and document URL are required" }, { status: 400 });
    }
    console.error("Failed to save session document:", error);
    return NextResponse.json({ error: "Could not save training document" }, { status: 500 });
  }
}