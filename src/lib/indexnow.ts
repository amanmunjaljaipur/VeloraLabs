import { getXmlSitemapEntries } from "@/lib/site-sitemap";
import { SITE_ORIGIN } from "@/lib/seo";

export const INDEXNOW_KEY = "verlinlabs-indexnow-key";
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
] as const;

export function getIndexNowKeyLocation(): string {
  return `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`;
}

export function getSitemapUrls(): string[] {
  return getXmlSitemapEntries().map((entry) => entry.url);
}

/** Legacy Google sitemap ping — deprecated but still triggers occasional crawls. */
export async function pingGoogleSitemap(): Promise<{ ok: boolean; status: number }> {
  const sitemap = `${SITE_ORIGIN}/sitemap.xml`;
  const response = await fetch(
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
    { method: "GET" }
  );
  return { ok: response.ok, status: response.status };
}

export async function submitUrlsToIndexNow(
  urls: string[]
): Promise<{ endpoint: string; ok: boolean; status: number }[]> {
  const host = new URL(SITE_ORIGIN).host;
  const keyLocation = getIndexNowKeyLocation();
  const body = { host, key: INDEXNOW_KEY, keyLocation, urlList: urls };

  const results: { endpoint: string; ok: boolean; status: number }[] = [];

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    results.push({ endpoint, ok: response.ok, status: response.status });
  }

  return results;
}