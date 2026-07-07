import { loadChatbotIndex } from "@/lib/chat/load-index";
import { buildChatMenu, getEntryAnswer } from "@/lib/chat/menu";
import { getActiveKnowledgeEntries } from "@/lib/chat/training-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 60;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

function getKnowledgeEntries() {
  const index = loadChatbotIndex();
  return index?.entries ?? getActiveKnowledgeEntries();
}

export async function GET() {
  const entries = getKnowledgeEntries();
  return NextResponse.json(buildChatMenu(entries));
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  let body: { entryId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const entryId = body.entryId?.trim();
  if (!entryId) {
    return NextResponse.json({ error: "entryId is required." }, { status: 400 });
  }

  const entries = getKnowledgeEntries();
  const response = getEntryAnswer(entryId, entries);
  if (!response) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  return NextResponse.json(response);
}