import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import type { LibraryItem } from "@/lib/content";
import type { BlogPost, BlogPostStatus, BlogStore } from "@/lib/blog/types";

const BLOG_FILE = "blog-posts.json";

const EMPTY: BlogStore = {
  version: 1,
  updatedAt: new Date().toISOString(),
  posts: [],
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

export function readBlogStore(): BlogStore {
  const data = readJsonFile<BlogStore>(BLOG_FILE, JSON.stringify(EMPTY));
  return {
    version: data.version ?? 1,
    updatedAt: data.updatedAt ?? EMPTY.updatedAt,
    posts: Array.isArray(data.posts) ? data.posts : [],
  };
}

export function writeBlogStore(store: BlogStore): void {
  writeJsonFile(BLOG_FILE, {
    ...store,
    updatedAt: new Date().toISOString(),
  });
}

export function listBlogPosts(filter?: {
  status?: BlogPostStatus | BlogPostStatus[];
}): BlogPost[] {
  const posts = readBlogStore().posts;
  if (!filter?.status) {
    return [...posts].sort((a, b) =>
      (b.scheduledAt ?? b.publishedAt).localeCompare(a.scheduledAt ?? a.publishedAt)
    );
  }
  const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
  return posts
    .filter((p) => statuses.includes(p.status))
    .sort((a, b) =>
      (b.scheduledAt ?? b.publishedAt).localeCompare(a.scheduledAt ?? a.publishedAt)
    );
}

export function getBlogPost(id: string): BlogPost | undefined {
  return readBlogStore().posts.find((p) => p.id === id);
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return readBlogStore().posts.find((p) => p.slug === slug);
}

export function uniqueBlogSlug(title: string, existing: BlogPost[]): string {
  const base = slugify(title) || `post-${Date.now()}`;
  let slug = base;
  let n = 1;
  const taken = new Set(existing.map((p) => p.slug));
  while (taken.has(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export function saveBlogPost(post: BlogPost): BlogPost {
  const store = readBlogStore();
  const idx = store.posts.findIndex((p) => p.id === post.id);
  if (idx >= 0) {
    store.posts[idx] = post;
  } else {
    store.posts.unshift(post);
  }
  writeBlogStore(store);
  return post;
}

export function deleteBlogPost(id: string): boolean {
  const store = readBlogStore();
  const next = store.posts.filter((p) => p.id !== id);
  if (next.length === store.posts.length) return false;
  store.posts = next;
  writeBlogStore(store);
  return true;
}

export function blogPostToLibraryItem(post: BlogPost): LibraryItem {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    description: post.description,
    summary: post.summary,
    duration: post.duration,
    level: post.level,
    audience: post.audience,
    type: post.type,
    featured: post.featured,
    image: post.image,
    author: post.author,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    tags: post.tags,
    sections: post.sections,
    keyTakeaway: post.keyTakeaway,
    relatedSlugs: post.relatedSlugs,
  };
}

/** Published scheduled blogs for public /blog and /blog/[slug] */
export function getPublishedBlogPosts(): BlogPost[] {
  return listBlogPosts({ status: "published" }).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );
}

/** Due scheduled posts whose scheduledAt is now or past */
export function getDueScheduledPosts(now = new Date()): BlogPost[] {
  const ts = now.toISOString();
  return readBlogStore().posts.filter(
    (p) => p.status === "scheduled" && p.scheduledAt && p.scheduledAt <= ts
  );
}

export function publishDueBlogPosts(now = new Date()): BlogPost[] {
  const store = readBlogStore();
  const ts = now.toISOString();
  const published: BlogPost[] = [];

  store.posts = store.posts.map((post) => {
    if (post.status === "scheduled" && post.scheduledAt && post.scheduledAt <= ts) {
      const next: BlogPost = {
        ...post,
        status: "published",
        publishedAt: post.scheduledAt,
        updatedAt: ts,
      };
      published.push(next);
      return next;
    }
    return post;
  });

  if (published.length > 0) {
    writeBlogStore(store);
  }
  return published;
}
