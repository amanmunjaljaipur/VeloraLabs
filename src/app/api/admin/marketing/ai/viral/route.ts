import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateViralIdeas, isViralIdeasConfigured, type ViralPlatform } from "@/lib/marketing/viral-ideas";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_PLATFORMS = new Set(["instagram", "facebook", "linkedin", "x"]);

/**
 * Viral idea generation for the Marketing Board. Body:
 * { topic?: string, platforms?: ("instagram"|"facebook"|"linkedin"|"x")[] }
 * Empty topic = auto-discover from this week's ingested AI news.
 */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isViralIdeasConfigured()) {
    return NextResponse.json({ error: "AI is not configured yet" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const topic = typeof body?.topic === "string" ? body.topic.trim().slice(0, 300) : "";
  const platforms: ViralPlatform[] = Array.isArray(body?.platforms)
    ? (body.platforms as unknown[])
        .filter((p): p is string => typeof p === "string")
        .map((p) => p.toLowerCase())
        .filter((p): p is ViralPlatform => VALID_PLATFORMS.has(p))
    : [];

  try {
    const ideas = await generateViralIdeas({ topic: topic || undefined, platforms });
    return NextResponse.json({ ideas });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Idea generation failed" },
      { status: 502 }
    );
  }
}
