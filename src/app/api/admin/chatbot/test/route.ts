import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { loadChatbotIndex } from "@/lib/chat/load-index";
import { retrieveAnswer, retrieveHybrid } from "@/lib/chat/retrieval";
import { getActiveKnowledgeEntries } from "@/lib/chat/training-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { message?: string; embedding?: number[] };
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const index = loadChatbotIndex();
  const entries = index?.entries ?? getActiveKnowledgeEntries();

  const response =
    body.embedding && index
      ? retrieveHybrid(message, entries, body.embedding)
      : retrieveAnswer(message, entries);

  return NextResponse.json(response);
}