import { auth } from "@/auth";
import { generateScriptFromCategory, generateLongFormScript, normalizeRawScript } from "@/lib/avatar-studio/agents/intake-agent";
import { enrichScript } from "@/lib/avatar-studio/agents/enrichment-agent";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_LONG_FORM_MINUTES = 1;
const MAX_LONG_FORM_MINUTES = 30;

/**
 * Intake + Enrichment: turns a category+topic into a draft script (LLM call)
 * or normalizes a pasted script, then applies category enrichment. Always
 * returns a DRAFT for the user to review/edit in the composer - nothing is
 * queued for rendering here (Section 5's non-negotiable: no direct-to-render
 * without a review step).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const rate = checkRateLimit(`avatar-script-generate:${session.user.email}:${ip}`, 20, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many script generations, please try again later" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
  const topic = typeof body?.topic === "string" ? body.topic.trim() : "";
  const rawScript = typeof body?.rawScript === "string" ? body.rawScript : "";
  const targetDurationMinutes =
    typeof body?.targetDurationMinutes === "number" && Number.isFinite(body.targetDurationMinutes)
      ? Math.min(MAX_LONG_FORM_MINUTES, Math.max(MIN_LONG_FORM_MINUTES, Math.round(body.targetDurationMinutes)))
      : null;

  if (!categoryId) return NextResponse.json({ error: "categoryId is required" }, { status: 400 });

  const draft = rawScript
    ? normalizeRawScript(rawScript)
    : targetDurationMinutes
      ? await generateLongFormScript(categoryId, topic, targetDurationMinutes)
      : await generateScriptFromCategory(categoryId, topic);
  if (!draft.ok) return NextResponse.json({ error: draft.error }, { status: 422 });

  const enriched = await enrichScript(categoryId, draft.script);
  if (!enriched.ok) return NextResponse.json({ error: enriched.error }, { status: 400 });

  return NextResponse.json({ draft: enriched.result });
}
