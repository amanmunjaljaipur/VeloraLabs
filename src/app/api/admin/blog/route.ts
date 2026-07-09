import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { generateBlogPost } from "@/lib/blog/generate";
import { BLOG_SEQUENCES, suggestNextSequenceId } from "@/lib/blog/sequences";
import { listBlogPosts, saveBlogPost } from "@/lib/blog/store";
import { isLlmConfigured, getLlmPublicInfo } from "@/lib/chat/llm-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const posts = listBlogPosts();
  const lastPublished = posts.find((p) => p.status === "published");
  const llm = getLlmPublicInfo();

  return NextResponse.json({
    posts,
    sequences: BLOG_SEQUENCES,
    suggestedSequenceId: suggestNextSequenceId(lastPublished?.sequenceId),
    llmEnabled: isLlmConfigured(),
    llmLabel: llm.label,
  });
}

export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    sequenceId?: string;
    customTopic?: string;
    scheduledAt?: string | null;
    status?: "draft" | "scheduled" | "published";
    generate?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.sequenceId) {
    return NextResponse.json({ error: "sequenceId is required" }, { status: 400 });
  }

  try {
    const status = body.status ?? "draft";
    let scheduledAt = body.scheduledAt ?? null;

    if (status === "scheduled") {
      if (!scheduledAt) {
        return NextResponse.json({ error: "scheduledAt is required for scheduled posts" }, { status: 400 });
      }
      if (new Date(scheduledAt).getTime() < Date.now() - 60_000) {
        return NextResponse.json({ error: "scheduledAt must be in the future" }, { status: 400 });
      }
    }

    if (status === "published") {
      scheduledAt = null;
    }

    const post = await generateBlogPost({
      sequenceId: body.sequenceId,
      customTopic: body.customTopic,
      scheduledAt,
      status,
      createdBy: session.user?.email ?? undefined,
    });

    if (status === "published") {
      post.publishedAt = new Date().toISOString();
      post.status = "published";
      post.scheduledAt = null;
    }

    saveBlogPost(post);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
