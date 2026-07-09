/**
 * Submit all public sitemap URLs to IndexNow (Bing, Yandex, etc.).
 * Usage: npx tsx scripts/submit-indexnow.ts
 */
import {
  getSitemapUrls,
  pingBingSitemap,
  pingGoogleSitemap,
  PRIORITY_INDEX_URLS,
  submitUrlsToIndexNow,
} from "../src/lib/indexnow";

async function main() {
  console.log(`Submitting ${PRIORITY_INDEX_URLS.length} priority URLs to IndexNow...`);
  const priorityResults = await submitUrlsToIndexNow([...PRIORITY_INDEX_URLS]);
  for (const result of priorityResults) {
    console.log(`[priority] ${result.endpoint}: ${result.status} ${result.ok ? "OK" : "FAILED"}`);
  }

  const urls = getSitemapUrls();
  console.log(`Submitting ${urls.length} sitemap URLs to IndexNow...`);
  const results = await submitUrlsToIndexNow(urls);
  for (const result of results) {
    console.log(`${result.endpoint}: ${result.status} ${result.ok ? "OK" : "FAILED"}`);
  }

  const [google, bing] = await Promise.all([pingGoogleSitemap(), pingBingSitemap()]);
  console.log(
    `Google sitemap ping: ${google.status} ${google.ok ? "OK" : "FAILED (deprecated endpoint)"}`
  );
  console.log(`Bing sitemap ping: ${bing.status} ${bing.ok ? "OK" : "FAILED"}`);

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const response = await fetch("https://www.verlinlabs.com/api/cron/indexnow", {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    console.log(`Production cron trigger: ${response.status} ${response.ok ? "OK" : "FAILED"}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});