import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Public delivery proxy for this project's Vercel Blob store.
 *
 * The store is private-only (Vercel Blob stores fix their access mode at
 * creation - see https://vercel.com/docs/vercel-blob/private-storage), so
 * anything that needs a durable, unauthenticated URL - AI-generated
 * marketing images that Meta/X/LinkedIn's own servers fetch when publishing
 * a post, blog cover images, admin-uploaded post media - is written with
 * access:"private" and served back out through this route instead of a
 * direct blob.url (which 404s/403s for anyone but us).
 *
 * Deliberately no auth check: the entire point of this route is that
 * third parties who cannot authenticate (social platforms' fetchers, a
 * reader's browser) must be able to load the file. Nothing sensitive should
 * ever be written through the "public via this proxy" path - use
 * data-store.ts's private Blob helpers directly for anything that isn't
 * meant to be public.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const pathname = (path ?? []).join("/");
  if (!pathname) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const result = await get(pathname, { access: "private" }).catch(() => null);
  if (!result || result.statusCode !== 200 || !result.stream) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      // Every pathname we hand out through this route is either uuid-named
      // or otherwise unique per upload, so the content at a given pathname
      // never changes - safe to cache aggressively at the edge and browser.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
