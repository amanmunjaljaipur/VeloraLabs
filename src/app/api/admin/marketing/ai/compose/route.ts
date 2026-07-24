import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { createChatCompletion, isLlmConfigured } from "@/lib/chat/llm-client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const PLATFORM_GUIDANCE: Record<string, string> = {
  instagram: "Instagram: casual and visual-first, short punchy lines, 1-3 relevant hashtags at the very end.",
  facebook: "Facebook: conversational and a little longer, invite comments or shares.",
  linkedin:
    "LinkedIn: professional but human, value-forward, short paragraphs with line breaks, at most 0-3 hashtags.",
  x: "X (formerly Twitter): tight and punchy, the ENTIRE post must fit under 280 characters, at most 1-2 hashtags.",
};

/** AI post-copy assist for the Marketing Board composer - reuses the free LLM client, no new keys needed. */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isLlmConfigured()) {
    return NextResponse.json({ error: "AI writing isn't configured yet" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const platforms: string[] = Array.isArray(body?.platforms)
    ? (body.platforms as unknown[]).filter((p): p is string => typeof p === "string")
    : [];
  const tone = typeof body?.tone === "string" ? body.tone.trim() : "";

  if (!prompt || prompt.length > 500) {
    return NextResponse.json({ error: "Describe what to post about in 1-500 characters" }, { status: 400 });
  }

  const guidance = platforms
    .map((p) => PLATFORM_GUIDANCE[p.toLowerCase()])
    .filter(Boolean)
    .join("\n");

  const system = [
    "You are a social media copywriter for Verlin Labs, a clarity-first AI education company.",
    "Write ONE post that works for the target platform(s) below - confident and clear, no corporate fluff, no em dashes.",
    "Return ONLY the post text itself - no preamble, no surrounding quotes, no \"Here's a post:\" framing.",
    guidance || "Write for a general professional social audience.",
    tone ? `Requested tone: ${tone}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      maxTokens: 500,
    });
    return NextResponse.json({ content: result.content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI writing failed" },
      { status: 502 }
    );
  }
}
