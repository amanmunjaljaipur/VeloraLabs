import { auth } from "@/auth";
import { loadNewsletterDraft } from "@/lib/newsletter-draft";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      html: draft.html,
    },
  });
}