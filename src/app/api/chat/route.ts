import { loadChatbotIndex } from "@/lib/chat/load-index";
import { getActiveKnowledgeEntries } from "@/lib/chat/training-store";
import { retrieveAnswer, retrieveHybrid } from "@/lib/chat/retrieval";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 30;
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

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  let body: { message?: string; embedding?: number[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message || message.length > 500) {
    return NextResponse.json({ error: "Message must be 1–500 characters." }, { status: 400 });
  }

  const index = loadChatbotIndex();
  const entries = index?.entries ?? getActiveKnowledgeEntries();

  const response =
    body.embedding && index
      ? retrieveHybrid(message, entries, body.embedding)
      : retrieveAnswer(message, entries);

  return NextResponse.json(response);
}