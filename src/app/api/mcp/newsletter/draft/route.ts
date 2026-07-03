import { loadNewsletterDraft } from "@/lib/newsletter-draft";
import { newsletterMcpUnauthorized, verifyNewsletterMcpKey } from "@/lib/newsletter-mcp-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!verifyNewsletterMcpKey(request)) {
    return newsletterMcpUnauthorized();
  }

  const draft = await loadNewsletterDraft();
  if (!draft || draft.status === "sent") {
    return NextResponse.json({ success: true, draft: null });
  }

  return NextResponse.json({
    success: true,
    draft: {
      id: draft.id,
      title: draft.title,
      intro: draft.intro,
      storyCount: draft.stories.length,
      status: draft.status,
      updatedAt: draft.updatedAt,
      stories: draft.stories.map((story) => ({
        title: story.title,
        source: story.source,
        summary: story.summary,
        url: story.url,
        mentalModelTip: story.mentalModelTip,
      })),
    },
  });
}