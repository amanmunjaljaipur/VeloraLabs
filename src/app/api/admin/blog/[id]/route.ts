import { requireCmsEditor } from "@/lib/cms/admin-auth";
import {
  deleteBlogPost,
  getBlogPost,
  saveBlogPost,
} from "@/lib/blog/store";
import type { BlogPostStatus } from "@/lib/blog/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const post = await getBlogPost(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(req: NextRequest, context: Ctx) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const existing = await getBlogPost(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: {
    status?: BlogPostStatus;
    scheduledAt?: string | null;
    title?: string;
    description?: string;
    summary?: string;
    featured?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const next = { ...existing, updatedAt: now };

  if (body.title?.trim()) next.title = body.title.trim();
  if (body.description?.trim()) next.description = body.description.trim();
  if (body.summary?.trim()) next.summary = body.summary.trim();
  if (typeof body.featured === "boolean") next.featured = body.featured;

  if (body.status) {
    next.status = body.status;
    if (body.status === "published") {
      // Manually publishing early (e.g. "Publish now" on a scheduled post)
      // must keep the original scheduled date/time intact, not stamp "now" -
      // mirrors the cron auto-publish behavior in publishDueBlogPosts().
      next.publishedAt = existing.scheduledAt ?? existing.publishedAt ?? now;
      next.scheduledAt = null;
    }
    if (body.status === "scheduled") {
      const at = body.scheduledAt ?? existing.scheduledAt;
      if (!at) {
        return NextResponse.json({ error: "scheduledAt required" }, { status: 400 });
      }
      next.scheduledAt = at;
      next.publishedAt = at;
    }
    if (body.status === "draft") {
      next.scheduledAt = null;
    }
  } else if (body.scheduledAt !== undefined) {
    next.scheduledAt = body.scheduledAt;
    if (body.scheduledAt && next.status === "draft") {
      next.status = "scheduled";
      next.publishedAt = body.scheduledAt;
    }
  }

  await saveBlogPost(next);
  return NextResponse.json({ post: next });
}

export async function DELETE(_req: NextRequest, context: Ctx) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  if (!(await deleteBlogPost(id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
