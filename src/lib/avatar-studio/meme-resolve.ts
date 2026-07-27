/**
 * Resolve free meme video URLs on the fly (Pexels when keyed, else curated fallbacks).
 */

import { getClipById, type FreeMemeClip } from "@/lib/avatar-studio/meme-catalog";

const FETCH_MS = 20_000;

/**
 * Try Pexels Videos API for a free download link; fall back to curated URL.
 * PEXELS_API_KEY is free from https://www.pexels.com/api/
 */
export async function resolveFreeMemeUrl(clip: FreeMemeClip): Promise<{
  url: string;
  source: "pexels" | "fallback";
}> {
  const key = process.env.PEXELS_API_KEY?.trim();
  if (key) {
    for (const q of clip.searchQueries) {
      try {
        const res = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=5&orientation=portrait`,
          {
            headers: { Authorization: key },
            signal: AbortSignal.timeout(FETCH_MS),
          }
        );
        if (!res.ok) continue;
        const data = (await res.json()) as {
          videos?: {
            video_files?: { link: string; width: number; height: number; quality?: string }[];
          }[];
        };
        const files = data.videos?.[0]?.video_files ?? [];
        // Prefer SD/HD mp4 under ~1280 wide for fast download
        const sorted = [...files]
          .filter((f) => f.link?.includes(".mp4") || f.link?.endsWith("mp4") || f.link)
          .sort((a, b) => Math.abs(a.width - 720) - Math.abs(b.width - 720));
        const best = sorted[0];
        if (best?.link) return { url: best.link, source: "pexels" };
      } catch {
        /* try next query */
      }
    }
  }
  return { url: clip.fallbackUrl, source: "fallback" };
}

export async function resolveClipId(clipId: string): Promise<{
  clip: FreeMemeClip;
  url: string;
  source: "pexels" | "fallback";
} | null> {
  const clip = getClipById(clipId);
  if (!clip) return null;
  const resolved = await resolveFreeMemeUrl(clip);
  return { clip, ...resolved };
}

/** Verify URL is downloadable; if not, try fallback. */
export async function downloadFreeVideoBuffer(
  preferredUrl: string,
  fallbackUrl: string
): Promise<{ ok: true; bytes: Buffer; usedUrl: string } | { ok: false; error: string }> {
  for (const url of [preferredUrl, fallbackUrl]) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(45_000),
        headers: { "User-Agent": "VerlinLabsAvatarStudio/1.0 (royalty-free meme stitch)" },
      });
      if (!res.ok) continue;
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.byteLength < 5_000) continue;
      return { ok: true, bytes, usedUrl: url };
    } catch {
      /* next */
    }
  }
  return { ok: false, error: "Could not download free meme clip" };
}
