import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { listMarketingPosts, recordMarketingPost } from "@/lib/marketing/posts-store";
import { publishToAccounts } from "@/lib/marketing/publisher";
import { createScheduledPost } from "@/lib/marketing/scheduled-posts-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const posts = await listMarketingPosts(tenantId);
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
  const imageUrls = Array.isArray(body?.imageUrls)
    ? body.imageUrls.filter((u: unknown): u is string => typeof u === "string" && u.trim().length > 0)
    : [];
  const slides = Array.isArray(body?.slides)
    ? body.slides
        .filter((s: unknown): s is { heading: string; body?: string } => Boolean(s) && typeof s === "object")
        .map((s: { heading?: unknown; body?: unknown }) => ({
          heading: typeof s.heading === "string" ? s.heading : "",
          body: typeof s.body === "string" ? s.body : undefined,
        }))
        .filter((s: { heading: string }) => s.heading.trim().length > 0)
    : [];

  if (!content || content.length > 3000) {
    return NextResponse.json({ error: "Post content must be 1-3000 characters" }, { status: 400 });
  }
  if (accountIds.length === 0) {
    return NextResponse.json({ error: "Choose at least one connected account" }, { status: 400 });
  }

  const tenantId = await resolveTenantId(session.user?.email);

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
      tenantId,
      content,
      imageUrl,
      imageUrls,
      slides,
      accountIds,
      scheduledAt: scheduledAt.toISOString(),
      createdBy: session.user?.email ?? "unknown",
    });
    return NextResponse.json({ scheduled }, { status: 201 });
  }

  const targets = await publishToAccounts(tenantId, accountIds, content, imageUrl, { imageUrls, slides });

  const post = await recordMarketingPost({
    tenantId,
    content,
    imageUrl,
    targets,
    createdBy: session.user?.email ?? "unknown",
  });

  const anyPublished = targets.some((t) => t.status === "published");
  return NextResponse.json({ post }, { status: anyPublished ? 201 : 502 });
}
