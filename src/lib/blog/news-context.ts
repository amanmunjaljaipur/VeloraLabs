/**
 * Pulls a handful of recent, well-received AI/tech headlines so generated
 * blog topics can nod to what is actually happening in the market instead
 * of being generic evergreen filler forever. Uses the free, no-API-key
 * Hacker News (Algolia) search endpoint - no paid news API required,
 * consistent with the rest of the free-tier content pipeline.
 *
 * Safety: this feeds an LLM prompt for an unsupervised content pipeline, so
 * results are filtered twice - an allow-list of AI/tech relevance keywords,
 * and a block-list of sensitive/violent/political terms that occasionally
 * surface in "AI" search results by coincidence (e.g. word matches inside
 * unrelated news). Anything not clearly on-topic and safe is dropped.
 * Best-effort only: on any failure, or if nothing passes the filters, this
 * returns an empty array and the caller writes from the sequence brief
 * alone, same as before this existed.
 */

const HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search_by_date";
const FETCH_TIMEOUT_MS = 8_000;
const LOOKBACK_DAYS = 21;
const MIN_POINTS = 15;

const ALLOW_KEYWORDS =
  /\b(ai|artificial intelligence|llm|gpt|openai|anthropic|claude|gemini|machine learning|generative|chatbot|agent|rag|embedding|transformer|copilot|prompt)\b/i;

const BLOCK_KEYWORDS =
  /\b(war|gaza|israel|kill|dead|death|attack|shoot|bomb|terror|assault|abuse|suicide|nazi|genocide|massacre|weapon|missile|hostage)\b/i;

interface HnHit {
  title?: string;
}

export async function fetchRecentAiHeadlines(limit = 5): Promise<string[]> {
  try {
    const since = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 24 * 60 * 60;
    const params = new URLSearchParams({
      query: "AI",
      tags: "story",
      numericFilters: `points>${MIN_POINTS},created_at_i>${since}`,
      hitsPerPage: "30",
    });

    const res = await fetch(`${HN_SEARCH_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { hits?: HnHit[] };
    const titles = (data.hits ?? [])
      .map((h) => h.title?.trim())
      .filter((t): t is string => Boolean(t) && t.length < 140)
      .filter((t) => ALLOW_KEYWORDS.test(t) && !BLOCK_KEYWORDS.test(t));

    return Array.from(new Set(titles)).slice(0, limit);
  } catch (error) {
    console.error("[blog] recent headlines fetch failed, continuing without them:", error);
    return [];
  }
}
