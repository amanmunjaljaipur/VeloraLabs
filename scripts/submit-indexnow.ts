/**
 * Submit all public sitemap URLs to IndexNow (Bing, Yandex, etc.).
 * Usage: npx tsx scripts/submit-indexnow.ts
 */
import {
  getSitemapUrls,
  pingGoogleSitemap,
  submitUrlsToIndexNow,
} from "../src/lib/indexnow";

async function main() {
  const urls = getSitemapUrls();
  console.log(`Submitting ${urls.length} URLs to IndexNow...`);
  const results = await submitUrlsToIndexNow(urls);
  for (const result of results) {
    console.log(`${result.endpoint}: ${result.status} ${result.ok ? "OK" : "FAILED"}`);
  }

  const google = await pingGoogleSitemap();
  console.log(`Google sitemap ping: ${google.status} ${google.ok ? "OK" : "FAILED"}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});