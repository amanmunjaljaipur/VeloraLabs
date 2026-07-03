import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { buildChatbotIndex } from "@/lib/chat/embed-index";
import {
  getActiveKnowledgeEntries,
  markTrainingComplete,
  saveRuntimeIndex,
} from "@/lib/chat/training-store";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const OUT_FILE = path.join(process.cwd(), "public", "chatbot", "index.json");

export async function POST() {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const entries = getActiveKnowledgeEntries();
    if (entries.length === 0) {
      return NextResponse.json({ error: "No enabled training entries" }, { status: 400 });
    }

    const index = await buildChatbotIndex(entries);
    saveRuntimeIndex(index);

    try {
      fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
      fs.writeFileSync(OUT_FILE, JSON.stringify(index));
    } catch {
      // public/ may be read-only on Vercel — runtime index still updated
    }

    markTrainingComplete();

    return NextResponse.json({
      ok: true,
      entries: entries.length,
      builtAt: index.builtAt,
      model: index.model,
    });
  } catch (err) {
    console.error("Chatbot retrain failed:", err);
    return NextResponse.json(
      { error: "Retrain failed. Try again or run npm run train:chatbot locally." },
      { status: 500 }
    );
  }
}