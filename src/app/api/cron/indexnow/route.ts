import { getSitemapUrls, pingGoogleSitemap, submitUrlsToIndexNow } from "@/lib/indexnow";
import { NextResponse } from "next/server";

/**
 * Vercel Cron — ping IndexNow with all sitemap URLs (Bing, Yandex, etc.).
 * GET /api/cron/indexnow
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const urls = getSitemapUrls();
  const [results, googlePing] = await Promise.all([
    submitUrlsToIndexNow(urls),
    pingGoogleSitemap(),
  ]);

  return NextResponse.json({
    submitted: urls.length,
    results,
    googlePing,
  });
}