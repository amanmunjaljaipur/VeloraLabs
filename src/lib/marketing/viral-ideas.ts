import { createChatCompletion, isLlmConfigured } from "@/lib/chat/llm-client";
import { listNewsUpdates } from "@/lib/news-updates";

/**
 * AI virality engine for the Marketing Board.
 *
 * Given an optional topic (or, when omitted, this week's ingested AI news
 * from the site's own news-updates store), asks the free LLM to act as a
 * social growth strategist: for each requested platform it proposes the
 * post most likely to travel - hook-first copy, the exact hashtags, what
 * kind of image will stop the scroll, a ready-to-run image-generation
 * prompt, the recommended format, and a 0-100 virality score with the
 * reasoning behind it. The composer can then apply a suggestion in one
 * click (copy + AI image), so "spot the viral angle -> post it" becomes a
 * single flow instead of five tools.
 */

export type ViralPlatform = "instagram" | "facebook" | "linkedin" | "x";

export interface ViralIdea {
  platform: ViralPlatform;
  topic: string;
  hook: string;
  content: string;
  hashtags: string[];
  imageStyle: string;
  imagePrompt: string;
  format: "single-image" | "carousel" | "text-only" | "pdf-document";
  viralityScore: number;
  rationale: string;
  bestTimeHint: string;
}

const PLATFORM_PLAYBOOK: Record<ViralPlatform, string> = {
  instagram:
    "Instagram: visual-first. Viral posts are bold single images or carousels with a huge 4-8 word hook overlaid, saveable/sharable value, 3-5 niche hashtags (not 30 generic ones). Format is usually single-image or carousel.",
  facebook:
    "Facebook: conversational storytelling wins - relatable openings, questions that bait comments, light emotion. 0-2 hashtags. Single image helps but copy carries it.",
  linkedin:
    "LinkedIn: contrarian-but-credible professional takes, personal lessons, numbered insights. Short lines, white space. 0-3 hashtags. Text-only and pdf-document (carousel) formats outperform links.",
  x: "X: one sharp idea in under 280 characters - punchy claim, stat, or hot take. 0-2 hashtags max. Text-only usually travels furthest; an image can amplify a strong stat.",
};

function buildSystemPrompt(platforms: ViralPlatform[]): string {
  return [
    "You are a senior social media growth strategist for Verlin Labs, a clarity-first AI education company (audience: school students, college engineers, product managers, mostly India).",
    "Your job: propose the MOST viral-worthy post for each requested platform, grounded in what actually spreads on each one.",
    "Platform playbooks:",
    ...platforms.map((p) => `- ${PLATFORM_PLAYBOOK[p]}`),
    "",
    "Respond with ONLY valid JSON (no markdown fences, no commentary): an array where each element is",
    `{"platform": "...", "topic": "...", "hook": "...", "content": "...", "hashtags": ["..."], "imageStyle": "...", "imagePrompt": "...", "format": "single-image|carousel|text-only|pdf-document", "viralityScore": 0-100, "rationale": "...", "bestTimeHint": "..."}`,
    "",
    "Rules:",
    "- content is the FULL ready-to-publish post text (hashtags appended at the end where the platform expects them; respect X's 280-char limit INCLUDING hashtags).",
    "- imagePrompt must be a self-contained text-to-image prompt (subject, style, composition, colors) that would produce a scroll-stopping image for this post. For text-only format, still provide a usable prompt in case the user wants an image anyway.",
    "- viralityScore reflects realistic organic potential for a small but growing account, not a celebrity account.",
    "- rationale is 1-2 sentences on why this angle spreads.",
    "- bestTimeHint is a short human hint like 'Weekday 9-11am IST' - India-first audience.",
    "- One element per requested platform, in the same order as requested.",
  ].join("\n");
}

function clampScore(n: unknown): number {
  const num = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function coerceIdea(raw: Record<string, unknown>, fallbackPlatform: ViralPlatform): ViralIdea | null {
  const platform = (typeof raw.platform === "string" ? raw.platform.toLowerCase() : fallbackPlatform) as ViralPlatform;
  if (!["instagram", "facebook", "linkedin", "x"].includes(platform)) return null;
  const content = typeof raw.content === "string" ? raw.content.trim() : "";
  if (!content) return null;

  const format = typeof raw.format === "string" ? raw.format : "single-image";
  return {
    platform,
    topic: typeof raw.topic === "string" ? raw.topic : "",
    hook: typeof raw.hook === "string" ? raw.hook : "",
    content,
    hashtags: Array.isArray(raw.hashtags)
      ? raw.hashtags.filter((h): h is string => typeof h === "string").slice(0, 10)
      : [],
    imageStyle: typeof raw.imageStyle === "string" ? raw.imageStyle : "",
    imagePrompt: typeof raw.imagePrompt === "string" ? raw.imagePrompt : "",
    format: (["single-image", "carousel", "text-only", "pdf-document"] as const).includes(
      format as ViralIdea["format"]
    )
      ? (format as ViralIdea["format"])
      : "single-image",
    viralityScore: clampScore(raw.viralityScore),
    rationale: typeof raw.rationale === "string" ? raw.rationale : "",
    bestTimeHint: typeof raw.bestTimeHint === "string" ? raw.bestTimeHint : "",
  };
}

/** Strip markdown fences if the model wrapped its JSON anyway. */
function extractJsonArray(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON array in response");
  return JSON.parse(trimmed.slice(start, end + 1));
}

export function isViralIdeasConfigured(): boolean {
  return isLlmConfigured();
}

export async function generateViralIdeas(input: {
  topic?: string;
  platforms: ViralPlatform[];
}): Promise<ViralIdea[]> {
  const platforms = input.platforms.length > 0 ? input.platforms : (["instagram", "facebook", "linkedin", "x"] as ViralPlatform[]);

  let topicBlock: string;
  if (input.topic?.trim()) {
    topicBlock = `Topic chosen by the user: ${input.topic.trim()}`;
  } else {
    // No topic given: mine this week's ingested AI news for the angle with
    // the most viral potential, so "what should we even post about" is
    // answered automatically from data the site already collects daily.
    const recent = await listNewsUpdates().catch(() => []);
    const headlines = recent.slice(0, 12).map((n) => `- ${n.title}: ${n.summary.slice(0, 140)}`);
    topicBlock =
      headlines.length > 0
        ? `No topic given. Pick the SINGLE most viral-worthy angle from this week's AI news below (or a sharper meta-take on it):\n${headlines.join("\n")}`
        : "No topic given and no recent news available. Pick the most viral-worthy evergreen AI-education angle for this audience (e.g. AI career fear, prompt myths, 'what schools get wrong about AI').";
  }

  const result = await createChatCompletion({
    messages: [
      { role: "system", content: buildSystemPrompt(platforms) },
      {
        role: "user",
        content: `${topicBlock}\n\nRequested platforms (one idea each, in order): ${platforms.join(", ")}`,
      },
    ],
    temperature: 0.7,
    maxTokens: 2000,
    timeoutMs: 40_000,
  });

  const parsed = extractJsonArray(result.content);
  if (!Array.isArray(parsed)) throw new Error("Model did not return an array");

  const ideas: ViralIdea[] = [];
  parsed.forEach((item, i) => {
    if (item && typeof item === "object") {
      const idea = coerceIdea(item as Record<string, unknown>, platforms[Math.min(i, platforms.length - 1)]!);
      if (idea) ideas.push(idea);
    }
  });

  if (ideas.length === 0) throw new Error("No usable ideas in model response");
  return ideas;
}
