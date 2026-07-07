import { getSitemapUrls, submitUrlsToIndexNow } from "@/lib/indexnow";
import { NextResponse } from "next/server";

/**
 * Ping IndexNow (Bing, Yandex, etc.) with all public sitemap URLs.
 * POST /api/indexnow
 * Authorization: Bearer <INDEXNOW_API_SECRET>
 */
export async function POST(request: Request) {
  const secret = process.env.INDEXNOW_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INDEXNOW_API_SECRET is not configured" },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const urls = getSitemapUrls();
  const results = await submitUrlsToIndexNow(urls);

  return NextResponse.json({
    submitted: urls.length,
    results,
  });
}