import { isGlmConfigured } from "@/lib/chat/glm-client";
import { answerWithGlm } from "@/lib/chat/llm-answer";
import { loadChatbotIndex } from "@/lib/chat/load-index";
import { buildChatMenu, getEntryAnswer } from "@/lib/chat/menu";
import { getActiveKnowledgeEntries } from "@/lib/chat/training-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 40;
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
  const menu = buildChatMenu(entries);
  return NextResponse.json({
    ...menu,
    llmEnabled: isGlmConfigured(),
    model: isGlmConfigured() ? process.env.GLM_MODEL?.trim() || "glm-5.2" : null,
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  let body: {
    entryId?: string;
    message?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const entries = getKnowledgeEntries();

  // FAQ menu path — exact trained answers
  const entryId = body.entryId?.trim();
  if (entryId) {
    const response = getEntryAnswer(entryId, entries);
    if (!response) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    return NextResponse.json(response);
  }

  // Free-form chat — GLM-5.2 with knowledge retrieval
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message or entryId is required." }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (item) =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string"
        )
        .slice(-8)
    : [];

  const response = await answerWithGlm({ message, entries, history });
  return NextResponse.json(response);
}
