/**
 * Resolve marketing media for server-side publishing.
 *
 * Composer stores private Blob files as `/api/media/<pathname>` so Meta/X/LinkedIn
 * can fetch them publicly. When *our* serverless functions re-fetch that URL over
 * HTTP (self-call on Vercel), they often time out or fail — which breaks X image
 * posts in production. Prefer reading Blob storage directly for those paths.
 */

import { get } from "@vercel/blob";

const FETCH_TIMEOUT_MS = 30_000;

export interface MediaBytes {
  bytes: Buffer;
  contentType: string;
}

/** If url is our private media proxy, return the Blob pathname; otherwise null. */
export function mediaProxyPathname(url: string): string | null {
  try {
    // Relative paths are allowed (e.g. /api/media/foo)
    const u = url.startsWith("http") ? new URL(url) : new URL(url, "https://local.invalid");
    const match = u.pathname.match(/^\/api\/media\/(.+)$/);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return Buffer.from(merged);
}

async function fromPrivateBlob(pathname: string): Promise<MediaBytes | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  // Local-dev media is not on Blob
  if (pathname.startsWith("local/")) return null;

  try {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;

    const bytes = await streamToBuffer(result.stream);
    if (!bytes.byteLength) return null;
    return {
      bytes,
      contentType: result.blob.contentType || "application/octet-stream",
    };
  } catch (error) {
    console.error("[marketing/media-fetch] private blob read failed", pathname, error);
    return null;
  }
}

/**
 * Load image/video bytes for a marketing asset URL.
 * Tries direct Blob for `/api/media/...`, then HTTP fetch as fallback.
 */
export async function fetchMarketingMediaBytes(url: string): Promise<MediaBytes | { error: string }> {
  if (!url?.trim()) return { error: "Empty media URL" };

  const pathname = mediaProxyPathname(url);
  if (pathname) {
    const direct = await fromPrivateBlob(pathname);
    if (direct) return direct;
  }

  try {
    const absolute =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://www.verlinlabs.com"}${url.startsWith("/") ? "" : "/"}${url}`;

    const res = await fetch(absolute, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "image/*,video/*,*/*" },
      // Avoid hanging on redirects forever
      redirect: "follow",
    });
    if (!res.ok) {
      return { error: `Could not fetch media (${res.status}) from ${pathname ? "proxy/fallback" : "URL"}` };
    }
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.byteLength) return { error: "Media file is empty" };
    return { bytes, contentType };
  } catch (error) {
    console.error("[marketing/media-fetch] HTTP fetch failed", url, error);
    return { error: "Could not download media for upload (timeout or network)" };
  }
}
