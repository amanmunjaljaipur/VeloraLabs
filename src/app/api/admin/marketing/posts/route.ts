import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { listMarketingPosts, recordMarketingPost } from "@/lib/marketing/posts-store";
import { publishToAccounts } from "@/lib/marketing/publisher";
import { createScheduledPost } from "@/lib/marketing/scheduled-posts-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await listMarketingPosts();
  return NextResponse.json({ posts });
}

/**
 * Publish to one or more connected accounts - immediately, or at a
 * scheduled time. Immediate publishing goes through the shared publisher
 * (per-target isolation: one platform failing never blocks the others).
 * With a future scheduledAt, the post is queued instead and the marketing
 * cron publishes it when due.
 * Body: { content, imageUrl?, accountIds: string[], scheduledAt?: ISO string }
 */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const imageUrl = typeof body?.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null;
  const accountIds = Array.isArray(body?.accountIds)
    ? body.accountIds.filter((id: unknown) => typeof id === "string")
    : [];
  const scheduledAtRaw = typeof body?.scheduledAt === "string" ? body.scheduledAt : "";

  if (!content || content.length > 3000) {
    return NextResponse.json({ error: "Post content must be 1-3000 characters" }, { status: 400 });
  }
  if (accountIds.length === 0) {
    return NextResponse.json({ error: "Choose at least one connected account" }, { status: 400 });
  }

  if (scheduledAtRaw) {
    const scheduledAt = new Date(scheduledAtRaw);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Invalid schedule time" }, { status: 400 });
    }
    if (scheduledAt.getTime() <= Date.now() + 60_000) {
      return NextResponse.json(
        { error: "Schedule time must be at least a minute in the future" },
        { status: 400 }
      );
    }
    const scheduled = await createScheduledPost({
      content,
      imageUrl,
      accountIds,
      scheduledAt: scheduledAt.toISOString(),
      createdBy: session.user?.email ?? "unknown",
    });
    return NextResponse.json({ scheduled }, { status: 201 });
  }

  const targets = await publishToAccounts(accountIds, content, imageUrl);

  const post = await recordMarketingPost({
    content,
    imageUrl,
    targets,
    createdBy: session.user?.email ?? "unknown",
  });

  const anyPublished = targets.some((t) => t.status === "published");
  return NextResponse.json({ post }, { status: anyPublished ? 201 : 502 });
}
