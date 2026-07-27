/**
 * Script → video genre + meme placement suggestions (no paid APIs required).
 * Rule-based classifier + section detection so users see *where* a free
 * meme b-roll fits before generate.
 */

import {
  FREE_MEME_CLIPS,
  clipsForGenre,
  type FreeMemeClip,
  type MemeMood,
  type VideoGenre,
} from "@/lib/avatar-studio/meme-catalog";

export interface MemePlacementSuggestion {
  id: string;
  /** 0–1 position through the script (and estimated video time). */
  positionRatio: number;
  /** Character index in script where the cut would sit */
  scriptIndex: number;
  /** Nearby script snippet for UI */
  scriptSnippet: string;
  /** Why we suggest a meme here */
  reason: string;
  mood: MemeMood;
  /** Ranked free clips for this slot */
  clipOptions: FreeMemeClip[];
  /** Default selected clip id */
  defaultClipId: string;
  /** Human label e.g. "After intro hook" */
  label: string;
}

export interface MemeSuggestResult {
  genre: VideoGenre;
  genreLabel: string;
  genreConfidence: "high" | "medium" | "low";
  genreReasons: string[];
  placements: MemePlacementSuggestion[];
  licenseNote: string;
}

const GENRE_RULES: { genre: VideoGenre; label: string; words: string[]; weight: number }[] = [
  {
    genre: "funny",
    label: "Funny / entertainment",
    words: ["joke", "lol", "funny", "hilarious", "meme", "prank", "awkward", "fail", "roast", "comedy", "haha"],
    weight: 3,
  },
  {
    genre: "educational",
    label: "Educational / explainer",
    words: [
      "learn",
      "explain",
      "how to",
      "tutorial",
      "step",
      "concept",
      "definition",
      "example",
      "lesson",
      "guide",
      "understand",
      "today we'll",
      "in this video",
    ],
    weight: 2,
  },
  {
    genre: "tech",
    label: "Tech / product",
    words: [
      "api",
      "code",
      "software",
      "app",
      "ai",
      "model",
      "deploy",
      "javascript",
      "python",
      "database",
      "cloud",
      "startup",
      "feature",
    ],
    weight: 2.5,
  },
  {
    genre: "motivational",
    label: "Motivational",
    words: ["dream", "success", "hustle", "mindset", "believe", "goals", "inspire", "never give up", "growth", "win"],
    weight: 2,
  },
  {
    genre: "storytelling",
    label: "Story / narrative",
    words: ["once", "story", "when i", "remember", "then", "suddenly", "journey", "chapter"],
    weight: 1.5,
  },
  {
    genre: "product",
    label: "Product / promo",
    words: ["buy", "offer", "discount", "product", "brand", "customers", "launch", "pricing", "subscribe"],
    weight: 2,
  },
];

function scoreGenre(scriptLower: string): { genre: VideoGenre; label: string; score: number; hits: string[] }[] {
  return GENRE_RULES.map((r) => {
    const hits = r.words.filter((w) => scriptLower.includes(w));
    return {
      genre: r.genre,
      label: r.label,
      score: hits.length * r.weight,
      hits,
    };
  }).sort((a, b) => b.score - a.score);
}

function splitSentences(script: string): { text: string; start: number; end: number }[] {
  const parts: { text: string; start: number; end: number }[] = [];
  const re = /[^.!?\n]+[.!?]+|[^.!?\n]+$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(script)) !== null) {
    const text = m[0].trim();
    if (text.length < 8) continue;
    parts.push({ text, start: m.index, end: m.index + m[0].length });
  }
  if (parts.length === 0 && script.trim()) {
    parts.push({ text: script.trim(), start: 0, end: script.length });
  }
  return parts;
}

function moodForSentence(text: string, genre: VideoGenre, index: number, total: number): MemeMood | null {
  const t = text.toLowerCase();
  if (index === 0) return "hook";
  if (index === total - 1) return "celebrate";
  if (/(funny|joke|lol|haha|awkward)/.test(t)) return "laugh";
  if (/(fail|wrong|mistake|broken|error|never)/.test(t)) return "fail";
  if (/(success|win|shipped|done|finally|result)/.test(t)) return "success";
  if (/(wow|surprising|imagine|actually|secret|key)/.test(t)) return "wow";
  if (/(agree|exactly|right|yes|true)/.test(t)) return "agree";
  if (/(think|consider|question|why|how)/.test(t)) return "think";
  // Educational: insert transition every ~3 sentences
  if (genre === "educational" && index > 0 && index % 3 === 0) return "transition";
  if (genre === "funny" && index % 2 === 1) return "laugh";
  if (genre === "tech" && index % 3 === 1) return "think";
  if (genre === "motivational" && index % 2 === 0) return "success";
  return null;
}

function clipsForMood(mood: MemeMood, genre: VideoGenre): FreeMemeClip[] {
  const pool = clipsForGenre(genre);
  const matched = pool.filter((c) => c.mood === mood);
  if (matched.length) return matched;
  // Fallback moods
  const map: Record<MemeMood, MemeMood[]> = {
    hook: ["hook", "transition", "think"],
    wow: ["wow", "success"],
    laugh: ["laugh", "fail"],
    agree: ["agree", "success"],
    fail: ["fail", "laugh"],
    success: ["success", "celebrate"],
    think: ["think", "transition"],
    transition: ["transition", "hook"],
    celebrate: ["celebrate", "success"],
  };
  const alts = map[mood] || ["transition"];
  const found = pool.filter((c) => alts.includes(c.mood));
  return found.length ? found : pool.slice(0, 3);
}

function reasonFor(mood: MemeMood, genre: VideoGenre): string {
  const map: Record<MemeMood, string> = {
    hook: "Opens the video with a relatable beat so viewers stick around",
    wow: "Highlights a surprising or important point",
    laugh: "Comic relief after a punchy line",
    agree: "Visual “yes” when you make a strong claim",
    fail: "Emphasizes a problem or anti-pattern",
    success: "Marks a win, result, or takeaway",
    think: "Gives a pause for a tip or explanation",
    transition: "Soft cut between sections so the video doesn’t feel static",
    celebrate: "Closes with energy after the final takeaway",
  };
  return `${map[mood]} (${genre} tone).`;
}

/**
 * Analyze script and return genre + up to maxPlacements meme slots.
 */
export function suggestMemesForScript(script: string, maxPlacements = 4): MemeSuggestResult {
  const cleaned = script.trim();
  const lower = cleaned.toLowerCase();
  const ranked = scoreGenre(lower);
  const top = ranked[0];
  const genre: VideoGenre = top && top.score > 0 ? top.genre : "general";
  const genreLabel =
    genre === "general" ? "General / mixed" : top?.label ?? "General";
  const genreConfidence: MemeSuggestResult["genreConfidence"] =
    !top || top.score === 0 ? "low" : top.score >= 6 ? "high" : "medium";
  const genreReasons =
    top && top.hits.length
      ? [`Matched tone words: ${top.hits.slice(0, 6).join(", ")}`]
      : ["No strong tone words — using versatile free b-roll"];

  const sentences = splitSentences(cleaned);
  const placements: MemePlacementSuggestion[] = [];
  const usedClipIds = new Set<string>();

  for (let i = 0; i < sentences.length && placements.length < maxPlacements; i++) {
    const sent = sentences[i]!;
    const mood = moodForSentence(sent.text, genre, i, sentences.length);
    if (!mood) continue;
    // Avoid stacking too close
    const ratio = cleaned.length > 0 ? sent.end / cleaned.length : (i + 1) / sentences.length;
    if (placements.some((p) => Math.abs(p.positionRatio - ratio) < 0.12)) continue;

    let options = clipsForMood(mood, genre);
    // Prefer unused clips
    options = [
      ...options.filter((c) => !usedClipIds.has(c.id)),
      ...options.filter((c) => usedClipIds.has(c.id)),
    ];
    if (options.length === 0) options = FREE_MEME_CLIPS.slice(0, 3);
    const defaultClip = options[0]!;
    usedClipIds.add(defaultClip.id);

    const snippet =
      sent.text.length > 90 ? `${sent.text.slice(0, 87).trim()}…` : sent.text;

    placements.push({
      id: `slot-${placements.length + 1}-${mood}`,
      positionRatio: Math.min(0.95, Math.max(0.05, ratio)),
      scriptIndex: sent.end,
      scriptSnippet: snippet,
      reason: reasonFor(mood, genre),
      mood,
      clipOptions: options.slice(0, 4),
      defaultClipId: defaultClip.id,
      label:
        i === 0
          ? "After opening line"
          : i === sentences.length - 1
            ? "Before closing"
            : `After: “${snippet.slice(0, 40)}${snippet.length > 40 ? "…" : ""}”`,
    });
  }

  // Ensure at least one placement for non-empty scripts
  if (placements.length === 0 && cleaned.length > 20) {
    const options = clipsForGenre(genre).slice(0, 4);
    const defaultClip = options[0] ?? FREE_MEME_CLIPS[0]!;
    placements.push({
      id: "slot-1-transition",
      positionRatio: 0.45,
      scriptIndex: Math.floor(cleaned.length * 0.45),
      scriptSnippet: cleaned.slice(0, 80),
      reason: "Mid-video free b-roll break so the presenter video feels more dynamic",
      mood: "transition",
      clipOptions: options.length ? options : FREE_MEME_CLIPS.slice(0, 3),
      defaultClipId: defaultClip.id,
      label: "Mid-video break",
    });
  }

  return {
    genre,
    genreLabel,
    genreConfidence,
    genreReasons,
    placements,
    licenseNote:
      "Clips are royalty-free stock (Pixabay / Pexels-style). Not copyrighted internet memes. Safe for free commercial use.",
  };
}

/** User selection persisted on the job */
export interface SelectedMemePlacement {
  placementId: string;
  clipId: string;
  positionRatio: number;
  scriptSnippet: string;
  label: string;
  mood: MemeMood;
  /** Resolved free download URL at job time */
  sourceUrl?: string;
}
