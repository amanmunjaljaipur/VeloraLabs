import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { saveBlogPost, uniqueBlogSlug, listBlogPosts } from "@/lib/blog/store";
import type { BlogPost, BlogPostStatus, BlogSection } from "@/lib/blog/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ImportPostInput {
  id?: string;
  slug?: string;
  title: string;
  description: string;
  summary: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  audience: string;
  type: "Article" | "Guide";
  featured?: boolean;
  image: string;
  author?: string;
  tags: string[];
  sections: BlogSection[];
  keyTakeaway: string;
  relatedSlugs?: string[];
  status: BlogPostStatus;
  /** Required when status is "scheduled" or "published" (backdatable). */
  scheduledAt?: string | null;
  publishedAt?: string;
}

/**
 * Bulk-import hand-written blog posts, bypassing AI generation entirely.
 * Used to seed the pipeline with pre-authored articles - each post arrives
 * fully formed (title, sections, etc.) and is saved as-is via saveBlogPost(),
 * same persistence path the AI-generation flow uses (so it survives Vercel
 * Blob deploys just like normal posts).
 */
export async function POST(request: Request) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { posts?: ImportPostInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!Array.isArray(body.posts) || body.posts.length === 0) {
    return NextResponse.json({ error: "posts[] is required" }, { status: 400 });
  }

  const saved: BlogPost[] = [];
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < body.posts.length; i++) {
    const input = body.posts[i];
    try {
      if (!input.title?.trim()) throw new Error("title is required");
      if (!Array.isArray(input.sections) || input.sections.length === 0) {
        throw new Error("sections[] is required");
      }
      if (input.status === "scheduled" && !input.scheduledAt) {
        throw new Error("scheduledAt is required when status is scheduled");
      }

      const existingPosts = [...(await listBlogPosts()), ...saved];
      const slug = input.slug?.trim() || uniqueBlogSlug(input.title, existingPosts);
      const now = new Date().toISOString();

      const scheduledAt = input.status === "scheduled" ? input.scheduledAt ?? null : null;
      const publishedAt =
        input.publishedAt ??
        (input.status === "scheduled" ? scheduledAt! : now);

      const post: BlogPost = {
        id: input.id?.trim() || `manual-${slug}-${Date.now()}-${i}`,
        slug,
        title: input.title.trim(),
        description: input.description ?? "",
        summary: input.summary ?? "",
        duration: input.duration ?? "8 min",
        level: input.level ?? "Intermediate",
        audience: (input.audience ?? "all") as BlogPost["audience"],
        type: input.type ?? "Article",
        featured: input.featured ?? false,
        image: input.image,
        author: input.author?.trim() || "Verlin Labs",
        publishedAt,
        updatedAt: now,
        tags: input.tags ?? [],
        sections: input.sections,
        keyTakeaway: input.keyTakeaway ?? "",
        relatedSlugs: input.relatedSlugs ?? [],
        status: input.status,
        scheduledAt,
        sequenceId: "manual",
        sequenceLabel: "Manually authored",
        generatedBy: "manual",
        createdAt: now,
        createdBy: session.user?.email ?? undefined,
      };

      await saveBlogPost(post);
      saved.push(post);
    } catch (error) {
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : "Failed to import post",
      });
    }
  }

  return NextResponse.json(
    { saved, errors, savedCount: saved.length, errorCount: errors.length },
    { status: errors.length > 0 && saved.length === 0 ? 400 : 201 }
  );
}
