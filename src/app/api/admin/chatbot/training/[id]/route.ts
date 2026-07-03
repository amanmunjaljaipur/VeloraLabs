import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import {
  deleteTrainingEntry,
  updateTrainingEntry,
} from "@/lib/chat/training-store";
import type { TrainingEntryInput } from "@/lib/chat/training-types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const updateSchema = z.object({
  category: z.string().min(1).max(80).optional(),
  question: z.string().min(3).max(500).optional(),
  answer: z.string().min(3).max(4000).optional(),
  alternateQuestions: z.array(z.string()).optional(),
  bullets: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  links: z
    .array(z.object({ label: z.string(), href: z.string() }))
    .optional(),
  enabled: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = updateSchema.parse(await req.json()) as Partial<TrainingEntryInput>;
    const entry = updateTrainingEntry(id, body, session.user.email ?? undefined);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ok = deleteTrainingEntry(id);
  if (!ok) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}