import {
  ensureDataFileHydrated,
  readJsonFile,
  writeJsonFileAsync,
} from "@/lib/data-store";
import type { LibraryItem } from "@/lib/content";
import type { BlogPost, BlogPostStatus, BlogStore } from "@/lib/blog/types";

const BLOG_FILE = "blog-posts.json";

const EMPTY: BlogStore = {
  version: 1,
  updatedAt: new Date().toISOString(),
  posts: [],
};

const EMPTY_JSON = JSON.stringify(EMPTY);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function readLocal(): BlogStore {
  const data = readJsonFile<BlogStore>(BLOG_FILE, EMPTY_JSON);
  return {
    version: data.version ?? 1,
    updatedAt: data.updatedAt ?? EMPTY.updatedAt,
    posts: Array.isArray(data.posts) ? data.posts : [],
  };
}

let loadPromise: Promise<void> | null = null;
let cache: BlogStore | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 3_000;

/**
 * Always force-hydrate from Blob on Vercel before reading. Without this, each
 * serverless instance keeps reading its own /tmp snapshot from cold start
 * forever - so an admin who publishes a post on one instance, then has their
 * next request routed to a different warm instance, sees the pre-publish
 * state and it looks like "publish" silently did nothing. Same pattern as
 * app-builder/store.ts and roles.ts.
 */
export async function ensureBlogStoreLoaded(force = false): Promise<BlogStore> {
  if (!force && cache && Date.now() - cacheAt < CACHE_TTL_MS) {
    return cache;
  }

  if (loadPromise) {
    await loadPromise;
    return cache ?? readLocal();
  }

  loadPromise = (async () => {
    await ensureDataFileHydrated(BLOG_FILE, EMPTY_JSON, { force: true });
    cache = readLocal();
    cacheAt = Date.now();
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }

  return cache ?? readLocal();
}

export async function writeBlogStore(store: BlogStore): Promise<void> {
  const next = { ...store, updatedAt: new Date().toISOString() };
  // Await the Blob upload so other serverless instances see the change on
  // their very next force-hydrated read, not just eventually.
  await writeJsonFileAsync(BLOG_FILE, next, EMPTY_JSON);
  cache = next;
  cacheAt = Date.now();
}

export async function listBlogPosts(filter?: {
  status?: BlogPostStatus | BlogPostStatus[];
}): Promise<BlogPost[]> {
  const store = await ensureBlogStoreLoaded();
  const posts = store.posts;
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

export async function getBlogPost(id: string): Promise<BlogPost | undefined> {
  const store = await ensureBlogStoreLoaded();
  return store.posts.find((p) => p.id === id);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const store = await ensureBlogStoreLoaded();
  return store.posts.find((p) => p.slug === slug);
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

export async function saveBlogPost(post: BlogPost): Promise<BlogPost> {
  // Force-hydrate right before the read-modify-write so we merge onto the
  // latest cross-instance state instead of clobbering it with a stale local copy.
  const store = await ensureBlogStoreLoaded(true);
  const idx = store.posts.findIndex((p) => p.id === post.id);
  const nextPosts = [...store.posts];
  if (idx >= 0) {
    nextPosts[idx] = post;
  } else {
    nextPosts.unshift(post);
  }
  await writeBlogStore({ ...store, posts: nextPosts });
  return post;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const store = await ensureBlogStoreLoaded(true);
  const next = store.posts.filter((p) => p.id !== id);
  if (next.length === store.posts.length) return false;
  await writeBlogStore({ ...store, posts: next });
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
export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const posts = await listBlogPosts({ status: "published" });
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Due scheduled posts whose scheduledAt is now or past */
export async function getDueScheduledPosts(now = new Date()): Promise<BlogPost[]> {
  const ts = now.toISOString();
  const store = await ensureBlogStoreLoaded(true);
  return store.posts.filter(
    (p) => p.status === "scheduled" && p.scheduledAt && p.scheduledAt <= ts
  );
}

export async function publishDueBlogPosts(now = new Date()): Promise<BlogPost[]> {
  const store = await ensureBlogStoreLoaded(true);
  const ts = now.toISOString();
  const published: BlogPost[] = [];

  const nextPosts = store.posts.map((post) => {
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
    await writeBlogStore({ ...store, posts: nextPosts });
  }
  return published;
}
