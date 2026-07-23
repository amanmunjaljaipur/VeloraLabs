import { put } from "@vercel/blob";

/**
 * Sources a fresh, relevant cover image for each generated blog post instead
 * of reusing one static image per sequence. Uses Openverse (openverse.org) -
 * a free, no-API-key search engine over openly-licensed (CC/public domain)
 * images - so this works out of the box on the free tier alongside the free
 * Groq/Gemini text generation, no paid image API required.
 *
 * The chosen image is re-hosted on Vercel Blob (same storage already used
 * for JSON persistence) so we control uptime/caching and never hotlink a
 * third-party origin that could disappear or rate-limit us.
 *
 * On any failure this returns null and the caller falls back to the
 * sequence's default static image - generation must never break because an
 * image search had a bad day.
 */

const OPENVERSE_SEARCH_URL = "https://api.openverse.org/v1/images/";
const MAX_BYTES = 8 * 1024 * 1024; // 8MB safety cap
const FETCH_TIMEOUT_MS = 12_000;

interface OpenverseResult {
  id: string;
  title?: string;
  url: string; // direct image asset URL
  width?: number;
  height?: number;
  license?: string;
}

/**
 * Builds a search query biased toward the kind of clean, professional,
 * abstract-tech imagery that performs well as a LinkedIn link-preview card -
 * i.e. avoids generic clipart and steers toward photography/illustration
 * that reads well at small thumbnail size.
 */
export function buildImageSearchQuery(input: {
  title: string;
  tags: string[];
  sequenceLabel: string;
}): string {
  const topicWords = input.tags.slice(0, 2).join(" ") || input.sequenceLabel;
  // Keep it short - Openverse (like most stock search) works best with 2-4
  // concrete nouns, not full sentences.
  return `${topicWords} technology abstract professional`.trim();
}

async function searchOpenverse(query: string): Promise<OpenverseResult | null> {
  const params = new URLSearchParams({
    q: query,
    license_type: "commercial,modification",
    orientation: "wide",
    aspect_ratio: "wide",
    size: "large",
    mature: "false",
    page_size: "10",
  });

  const res = await fetch(`${OPENVERSE_SEARCH_URL}?${params.toString()}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { results?: OpenverseResult[] };
  const candidates = (data.results ?? []).filter(
    (r) => r.url && (r.width ?? 0) >= 800
  );
  if (!candidates.length) return null;

  // Pick pseudo-randomly among the top candidates so repeated posts in the
  // same sequence don't all grab the #1 result.
  const pick = candidates[Math.floor(Math.random() * Math.min(candidates.length, 6))];
  return pick ?? null;
}

/**
 * Fetches a relevant image for `query`, uploads it to Vercel Blob under
 * `blog-images/<slug>.<ext>`, and returns the hosted URL. Returns null on
 * any failure (network, no BLOB token, bad content-type, etc.).
 */
export async function fetchBlogCoverImage(input: {
  query: string;
  slug: string;
}): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  try {
    const picked = await searchOpenverse(input.query);
    if (!picked) return null;

    const imgRes = await fetch(picked.url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!imgRes.ok) return null;

    const contentType = imgRes.headers.get("content-type") || "";
    if (!/^image\/(jpeg|jpg|png|webp)/i.test(contentType)) return null;

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) return null;

    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

    const blob = await put(`blog-images/${input.slug}.${ext}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    return blob.url;
  } catch (error) {
    console.error("[blog] image search failed, using fallback image:", error);
    return null;
  }
}
