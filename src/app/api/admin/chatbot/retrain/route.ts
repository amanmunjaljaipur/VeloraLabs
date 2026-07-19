import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { buildChatbotIndex } from "@/lib/chat/embed-index";
import {
  enrichTrainingDatasetAlternates,
  getActiveKnowledgeEntries,
  markTrainingComplete,
  readTrainingDataset,
  saveRuntimeIndex,
  writeTrainingDataset,
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

  const { assertAgentActive } = await import("@/lib/agents/controls");
  const paused = await assertAgentActive("chatbot-retrain");
  if (paused) return NextResponse.json(paused, { status: 503 });

  try {
    // Expand labeled question variations before embedding so free-form chat matches better
    const { dataset, changed } = enrichTrainingDatasetAlternates(readTrainingDataset());
    if (changed > 0) {
      writeTrainingDataset(dataset);
    }

    const entries = getActiveKnowledgeEntries();
    if (entries.length === 0) {
      return NextResponse.json({ error: "No enabled training entries" }, { status: 400 });
    }

    const index = await buildChatbotIndex(entries);
    // Persist trained index to Blob (chatbot-index.json is runtime + awaited Blob write)
    saveRuntimeIndex(index);

    try {
      fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
      fs.writeFileSync(OUT_FILE, JSON.stringify(index));
    } catch {
      // public/ may be read-only on Vercel - runtime/Blob index still updated
    }

    markTrainingComplete();

    return NextResponse.json({
      ok: true,
      entries: entries.length,
      alternatesEnriched: changed,
      averageAlternates:
        Math.round(
          (dataset.entries.reduce((s, e) => s + (e.alternateQuestions?.length ?? 0), 0) /
            Math.max(dataset.entries.length, 1)) *
            10
        ) / 10,
      builtAt: index.builtAt,
      model: index.model,
      persistedTo: "blob+runtime",
    });
  } catch (err) {
    console.error("Chatbot retrain failed:", err);
    return NextResponse.json(
      { error: "Retrain failed. Try again or run npm run train:chatbot locally." },
      { status: 500 }
    );
  }
}