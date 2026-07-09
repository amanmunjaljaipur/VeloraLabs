import { getXmlSitemapEntries } from "@/lib/site-sitemap";
import { SITE_ORIGIN } from "@/lib/seo";

export const INDEXNOW_KEY = "verlinlabs-indexnow-key";
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
] as const;

/** Priority URLs crawled first — homepage, money pages, fresh SEO content. */
export const PRIORITY_INDEX_URLS = [
  `${SITE_ORIGIN}/`,
  `${SITE_ORIGIN}/free-session`,
  `${SITE_ORIGIN}/programs`,
  `${SITE_ORIGIN}/courses`,
  `${SITE_ORIGIN}/ai-for-students`,
  `${SITE_ORIGIN}/ai-for-engineers`,
  `${SITE_ORIGIN}/ai-for-pms`,
  `${SITE_ORIGIN}/mental-models`,
  `${SITE_ORIGIN}/library`,
  `${SITE_ORIGIN}/about`,
  `${SITE_ORIGIN}/faq`,
  `${SITE_ORIGIN}/contact`,
  `${SITE_ORIGIN}/corporate`,
] as const;

export function getIndexNowKeyLocation(): string {
  return `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`;
}

export function getSitemapUrls(): string[] {
  return getXmlSitemapEntries().map((entry) => entry.url);
}

/** Legacy Google sitemap ping — deprecated since 2023; kept for logging only. */
export async function pingGoogleSitemap(): Promise<{ ok: boolean; status: number }> {
  const sitemap = `${SITE_ORIGIN}/sitemap.xml`;
  const response = await fetch(
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
    { method: "GET" }
  );
  return { ok: response.ok, status: response.status };
}

/** Notify Bing Webmaster Tools that the sitemap changed. */
export async function pingBingSitemap(): Promise<{ ok: boolean; status: number }> {
  const sitemap = `${SITE_ORIGIN}/sitemap.xml`;
  const response = await fetch(
    `https://www.bing.com/webmaster/ping.aspx?siteMap=${encodeURIComponent(sitemap)}`,
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