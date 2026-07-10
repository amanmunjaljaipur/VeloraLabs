import { generateNewsletterDraftFromWeb } from "@/lib/newsletter-generator";
import { newsletterMcpUnauthorized, verifyNewsletterMcpKey } from "@/lib/newsletter-mcp-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!verifyNewsletterMcpKey(request)) {
    return newsletterMcpUnauthorized();
  }

  const { assertAgentActive } = await import("@/lib/agents/controls");
  const paused = await assertAgentActive("newsletter-mcp");
  if (paused) return NextResponse.json(paused, { status: 503 });

  try {
    const draft = await generateNewsletterDraftFromWeb();
    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        title: draft.title,
        intro: draft.intro,
        storyCount: draft.stories.length,
        status: draft.status,
        updatedAt: draft.updatedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}