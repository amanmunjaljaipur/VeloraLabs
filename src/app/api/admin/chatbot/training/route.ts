import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import { getDeployedChatbotIndexMeta } from "@/lib/chat/index-meta";
import { loadChatbotIndex } from "@/lib/chat/load-index";
import {
  createTrainingEntry,
  readTrainingDataset,
} from "@/lib/chat/training-store";
import type { TrainingEntryInput } from "@/lib/chat/training-types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const entrySchema = z.object({
  category: z.string().min(1).max(80),
  question: z.string().min(3).max(500),
  answer: z.string().min(3).max(4000),
  alternateQuestions: z.array(z.string()).optional(),
  bullets: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  links: z
    .array(z.object({ label: z.string(), href: z.string() }))
    .optional(),
  enabled: z.boolean().optional(),
});

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dataset = readTrainingDataset();
  const categories = [...new Set(dataset.entries.map((e) => e.category))].sort();
  const deployed = getDeployedChatbotIndexMeta();
  const liveIndex = loadChatbotIndex();

  return NextResponse.json({
    ...dataset,
    categories,
    stats: {
      total: dataset.entries.length,
      enabled: dataset.entries.filter((e) => e.enabled).length,
    },
    live: {
      ready: Boolean(liveIndex?.entries?.length),
      entryCount: liveIndex?.entries?.length ?? 0,
      builtAt: liveIndex?.builtAt ?? deployed?.builtAt ?? null,
      model: liveIndex?.model ?? deployed?.model ?? null,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = entrySchema.parse(await req.json()) as TrainingEntryInput;
    const entry = createTrainingEntry(body, "manual", session.user.email ?? undefined);
    return NextResponse.json({ entry });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}