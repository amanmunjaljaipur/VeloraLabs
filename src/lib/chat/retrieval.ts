import { formatKnowledgeAnswer } from "./format-answer";
import type { ChatResponse, KnowledgeEntry, ScoredEntry } from "./types";

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one",
  "our", "out", "day", "get", "has", "him", "his", "how", "its", "may", "new", "now", "old",
  "see", "two", "way", "who", "boy", "did", "she", "use", "her", "what", "when", "where",
  "which", "with", "this", "that", "from", "they", "will", "your", "about", "have", "been",
  "there", "their", "would", "could", "should", "does", "into", "than", "then", "them",
  "also", "just", "like", "very", "much", "any", "some", "more", "most", "other",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function scoreBm25(query: string, entries: KnowledgeEntry[]): ScoredEntry[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const docFreq = new Map<string, number>();
  const docTokens = entries.map((entry) => {
    const alts = entry.alternateQuestions?.join(" ") ?? "";
    const text = `${entry.question} ${alts} ${entry.answer} ${entry.category} ${entry.keywords.join(" ")}`;
    const tokens = tokenize(text);
    const unique = new Set(tokens);
    for (const t of unique) {
      docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
    }
    return tokens;
  });

  const N = entries.length;
  const k1 = 1.2;
  const b = 0.75;
  const avgLen = docTokens.reduce((s, t) => s + t.length, 0) / N || 1;

  return entries
    .map((entry, i) => {
      const tokens = docTokens[i]!;
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);

      let score = 0;
      for (const qt of queryTokens) {
        const freq = tf.get(qt) ?? 0;
        if (freq === 0) continue;
        const df = docFreq.get(qt) ?? 0;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        const lenNorm = 1 - b + b * (tokens.length / avgLen);
        score += idf * ((freq * (k1 + 1)) / (freq + k1 * lenNorm));
      }

      // Boost exact phrase overlap in question + alternates
      const qLower = query.toLowerCase();
      const questions = [entry.question, ...(entry.alternateQuestions ?? [])];
      for (const q of questions) {
        const ql = q.toLowerCase();
        if (ql.includes(qLower) || qLower.includes(ql.slice(0, 20))) {
          score += 3;
          break;
        }
      }

      // Keyword boost
      for (const kw of entry.keywords) {
        if (queryTokens.some((qt) => kw.includes(qt) || qt.includes(kw))) {
          score += 0.5;
        }
      }

      return { ...entry, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function scoreSemantic(
  queryEmbedding: number[],
  entries: Array<KnowledgeEntry & { embedding?: number[] }>
): ScoredEntry[] {
  return entries
    .filter((e) => e.embedding && e.embedding.length > 0)
    .map((entry) => ({
      ...entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding!),
    }))
    .filter((e) => e.score > 0.25)
    .sort((a, b) => b.score - a.score);
}

export function mergeScores(bm25: ScoredEntry[], semantic: ScoredEntry[]): ScoredEntry[] {
  const map = new Map<string, ScoredEntry>();

  for (const entry of bm25) {
    map.set(entry.id, { ...entry, score: entry.score * 0.45 });
  }

  for (const entry of semantic) {
    const existing = map.get(entry.id);
    if (existing) {
      existing.score += entry.score * 0.55;
    } else {
      map.set(entry.id, { ...entry, score: entry.score * 0.55 });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

const FALLBACK_SUGGESTIONS = [
  "Is the free session really free?",
  "What are the course prices?",
  "How do I book the free session?",
  "What is the difference between the three tracks?",
];

const LOW_CONFIDENCE =
  "I am not fully sure about that one.\n\nYou can browse our **FAQ**, book a **free session** to ask live, or **contact us** directly - we will get you a clear answer.";

export function formatAnswer(entry: KnowledgeEntry): string {
  return formatKnowledgeAnswer(entry);
}

export function buildChatResponse(
  query: string,
  ranked: ScoredEntry[],
  maxConfidence = 1
): ChatResponse {
  const top = ranked[0];

  if (!top || top.score < 0.35) {
    return {
      answer: LOW_CONFIDENCE,
      links: [
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/contact" },
        { label: "Book free session", href: "/free-session" },
      ],
      suggestions: FALLBACK_SUGGESTIONS,
      confidence: 0,
    };
  }

  const normalizedScore = Math.min(top.score / maxConfidence, 1);
  const related = ranked
    .slice(1, 4)
    .filter((e) => e.category === top.category || e.score > top.score * 0.5)
    .map((e) => e.question);

  const suggestions =
    related.length > 0
      ? related.slice(0, 3)
      : FALLBACK_SUGGESTIONS.filter((s) => s !== top.question).slice(0, 3);

  return {
    answer: formatAnswer(top),
    links: top.links,
    suggestions,
    confidence: normalizedScore,
  };
}

export function retrieveAnswer(query: string, entries: KnowledgeEntry[]): ChatResponse {
  const ranked = scoreBm25(query, entries);
  const maxScore = ranked[0]?.score ?? 1;
  return buildChatResponse(query, ranked, Math.max(maxScore, 1));
}

export function retrieveHybrid(
  query: string,
  entries: Array<KnowledgeEntry & { embedding?: number[] }>,
  queryEmbedding?: number[]
): ChatResponse {
  const bm25 = scoreBm25(query, entries);
  const semantic = queryEmbedding ? scoreSemantic(queryEmbedding, entries) : [];
  const ranked = semantic.length > 0 ? mergeScores(bm25, semantic) : bm25;
  const maxScore = ranked[0]?.score ?? 1;
  return buildChatResponse(query, ranked, Math.max(maxScore, 1));
}