import { requireSuperAdmin } from "@/lib/chat/admin-auth";
import {
  addKnownGap,
  addProductionStandingNote,
  getAgentContext,
  getOpsMemory,
  logExperience,
  setAgentPreference,
} from "@/lib/app-builder/ops-memory";
import type { ExperienceKind } from "@/lib/app-builder/ops-memory-types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Deploy-safe operational memory for App Builder agents.
 * GET: full memory / context
 * POST: log experience, standing note, gap, preference
 */
export async function GET(request: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const verticalId = url.searchParams.get("verticalId") || undefined;
  const mode = url.searchParams.get("mode") || "full";

  if (mode === "context") {
    const ctx = await getAgentContext({ verticalId, experienceLimit: 30 });
    return NextResponse.json({
      ...ctx,
      note: "Operational memory — stored in Blob, not reset by product deploys",
    });
  }

  const memory = await getOpsMemory();
  return NextResponse.json({
    memory,
    note: "memoryClass=operational; survives Vercel deploys; never git-seeded",
  });
}

export async function POST(request: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    action?: string;
    agent?: string;
    kind?: ExperienceKind;
    summary?: string;
    detail?: string;
    verticalId?: string;
    tags?: string[];
    productionSafe?: boolean;
    note?: string;
    gap?: string;
    severity?: "low" | "medium" | "high";
    key?: string;
    value?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const action = body.action || "experience";

  if (action === "experience") {
    if (!body.summary?.trim()) {
      return NextResponse.json({ error: "summary required" }, { status: 400 });
    }
    const entry = await logExperience({
      agent: body.agent || "experience-learner",
      kind: body.kind || "other",
      summary: body.summary,
      detail: body.detail,
      verticalId: body.verticalId,
      tags: body.tags,
      productionSafe: body.productionSafe,
    });
    return NextResponse.json({ ok: true, entry });
  }

  if (action === "standing_note") {
    if (!body.note?.trim()) {
      return NextResponse.json({ error: "note required" }, { status: 400 });
    }
    await addProductionStandingNote(body.note, body.tags || []);
    return NextResponse.json({ ok: true });
  }

  if (action === "known_gap") {
    if (!body.gap?.trim()) {
      return NextResponse.json({ error: "gap required" }, { status: 400 });
    }
    await addKnownGap({ gap: body.gap, severity: body.severity });
    return NextResponse.json({ ok: true });
  }

  if (action === "preference") {
    if (!body.key?.trim() || body.value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }
    await setAgentPreference(body.key, body.value);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
