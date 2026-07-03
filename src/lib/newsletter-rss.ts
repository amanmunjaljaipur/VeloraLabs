export interface RssStory {
  title: string;
  link: string;
  summary: string;
  source: string;
  publishedAt: string;
}

const AI_RSS_FEEDS = [
  { name: "OpenAI", url: "https://openai.com/blog/rss.xml" },
  { name: "Google AI", url: "https://blog.google/technology/ai/rss/" },
  { name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/" },
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    name: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
] as const;

const AI_KEYWORDS =
  /\b(ai|artificial intelligence|llm|gpt|gemini|claude|model|agent|neural|machine learning|deep learning|transformer|reasoning|alignment|mental model|framework)\b/i;

function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block: string, tag: string): string {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(cdata) ?? block.match(plain);
  return match ? decodeXml(match[1]) : "";
}

function parseRss(xml: string, source: string): RssStory[] {
  const stories: RssStory[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[0];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link") || extractTag(block, "guid");
    const summary =
      extractTag(block, "description") || extractTag(block, "content:encoded") || extractTag(block, "summary");
    const publishedAt = extractTag(block, "pubDate") || new Date().toISOString();

    if (!title || !link) continue;

    stories.push({
      title,
      link,
      summary: summary.slice(0, 320),
      source,
      publishedAt,
    });
  }

  return stories;
}

function relevanceScore(story: RssStory): number {
  const text = `${story.title} ${story.summary}`;
  const matches = text.match(new RegExp(AI_KEYWORDS.source, "gi"));
  const keywordScore = matches?.length ?? 0;
  const ageMs = Date.now() - new Date(story.publishedAt).getTime();
  const recencyScore = Number.isFinite(ageMs) ? Math.max(0, 14 - ageMs / (1000 * 60 * 60 * 24)) : 5;
  return keywordScore * 2 + recencyScore;
}

export async function fetchLatestAiStories(limit = 5): Promise<RssStory[]> {
  const results = await Promise.allSettled(
    AI_RSS_FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "VerlinLabsNewsletterBot/1.0" },
        signal: AbortSignal.timeout(12_000),
        next: { revalidate: 0 },
      });
      if (!res.ok) throw new Error(`Feed failed: ${feed.name}`);
      const xml = await res.text();
      return parseRss(xml, feed.name);
    })
  );

  const allStories = results
    .filter((r): r is PromiseFulfilledResult<RssStory[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .filter((story) => AI_KEYWORDS.test(`${story.title} ${story.summary}`));

  const seen = new Set<string>();
  const unique = allStories.filter((story) => {
    const key = story.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique
    .sort((a, b) => relevanceScore(b) - relevanceScore(a))
    .slice(0, limit);
}

export async function fetchStoryImage(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "VerlinLabsNewsletterBot/1.0" },
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 0 },
    });
    if (!res.ok) return undefined;
    const html = await res.text();
    const og =
      html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ??
      html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    return og?.[1];
  } catch {
    return undefined;
  }
}