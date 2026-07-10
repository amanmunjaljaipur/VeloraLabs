import { auth } from "@/auth";
import { generateNewsletterDraftFromWeb } from "@/lib/newsletter-generator";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { assertAgentActive } = await import("@/lib/agents/controls");
  const paused = await assertAgentActive("newsletter-ai");
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
        html: draft.html,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}