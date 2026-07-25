import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { applyBrandWatermark } from "@/lib/marketing/brand-watermark";

/**
 * Free AI image generation for the Marketing Board composer, via
 * Pollinations.ai (Flux-based, no API key or signup required - matches
 * this codebase's free-tier-first approach to AI features, same spirit as
 * the Groq/Gemini free LLM in chat/llm-client.ts).
 *
 * The generated image is re-hosted on Vercel Blob because a Pollinations
 * URL is a live-generation endpoint, not stable hosting - Meta/LinkedIn/X's
 * own servers need to fetch a durable URL when a post with this image is
 * published, potentially well after generation time.
 *
 * This project's Blob store is private-only, so the upload uses
 * access:"private" and the URL handed back points at /api/media/... (see
 * that route) instead of the raw blob.url, which would 403 for anyone but
 * us. See https://vercel.com/docs/vercel-blob/private-storage.
 */

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verlinlabs.com").replace(/\/$/, "");

export function isAiImageConfigured(): boolean {
  // Pollinations itself needs no key; only Blob storage (already required
  // for the rest of this app's runtime data) is needed to re-host results.
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function generateMarketingImage(
  prompt: string,
  opts?: { width?: number; height?: number }
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const trimmed = prompt.trim();
  if (!trimmed) return { ok: false, error: "Describe the image you want" };
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, error: "Image hosting (Vercel Blob) is not configured" };
  }

  const width = opts?.width ?? 1080;
  const height = opts?.height ?? 1080;
  const seed = Math.floor(Math.random() * 1_000_000);
  const genUrl = `${POLLINATIONS_BASE}/${encodeURIComponent(trimmed)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

  try {
    const res = await fetch(genUrl, { signal: AbortSignal.timeout(45_000) });
    if (!res.ok || !res.body) {
      return { ok: false, error: `Image generation failed (${res.status})` };
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const bytes = await res.arrayBuffer();

    if (bytes.byteLength < 500) {
      // Pollinations returns a tiny placeholder/error body on failure rather
      // than a non-200 status in some cases - guard against saving that.
      return { ok: false, error: "Image generation did not return a usable image - try a different prompt" };
    }

    const watermarked = await applyBrandWatermark(Buffer.from(bytes), contentType);

    const key = `verlin-labs/marketing-ai-images/${randomUUID()}.${ext}`;
    await put(key, watermarked, {
      access: "private",
      addRandomSuffix: false,
      contentType,
    });

    return { ok: true, url: `${SITE_URL}/api/media/${key}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Image generation failed" };
  }
}
