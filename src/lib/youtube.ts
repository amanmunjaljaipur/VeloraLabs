const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }
      const embedMatch = parsed.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch?.[1] && YOUTUBE_ID_PATTERN.test(embedMatch[1])) {
        return embedMatch[1];
      }
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/]+)/);
      if (shortsMatch?.[1] && YOUTUBE_ID_PATTERN.test(shortsMatch[1])) {
        return shortsMatch[1];
      }
      const liveMatch = parsed.pathname.match(/^\/live\/([^/]+)/);
      if (liveMatch?.[1] && YOUTUBE_ID_PATTERN.test(liveMatch[1])) {
        return liveMatch[1];
      }
      const vMatch = parsed.pathname.match(/^\/v\/([^/]+)/);
      if (vMatch?.[1] && YOUTUBE_ID_PATTERN.test(vMatch[1])) {
        return vMatch[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}