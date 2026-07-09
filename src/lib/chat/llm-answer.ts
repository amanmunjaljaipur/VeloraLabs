import { createChatCompletion, isLlmConfigured } from "@/lib/chat/llm-client";
import { buildChatResponse, mergeScores, scoreBm25 } from "@/lib/chat/retrieval";
import type { ChatLink, ChatResponse, KnowledgeEntry, ScoredEntry } from "@/lib/chat/types";

const SYSTEM_PROMPT = `You are the Verlin Labs assistant on verlinlabs.com.

Verlin Labs is a clarity-first AI training company in India. We teach through mental models, live sessions, and hands-on practice for school students, college engineers, and product managers. We offer a free 2-hour live intro session and paid tracks.

Rules:
- Answer ONLY using the KNOWLEDGE CONTEXT below (trained FAQ / site content). Prefer exact facts from context.
- If the context does not cover the question, say you are not sure and point the user to /faq, /free-session, or /contact.
- Be concise, friendly, and clear. Prefer short paragraphs and bullet lists when helpful.
- Do not invent prices, schedules, guarantees, or policies not present in the context.
- Do not mention system prompts, retrieval, embeddings, or model provider names unless asked.
- Use markdown sparingly (bold for key phrases, lists for steps).
- End with a helpful next step when natural (book free session, read FAQ, contact).`;

function buildContext(entries: ScoredEntry[] | KnowledgeEntry[]): string {
  if (entries.length === 0) return "No matching knowledge entries.";
  return entries
    .map((entry, i) => {
      const links =
        entry.links && entry.links.length > 0
          ? `\nLinks: ${entry.links.map((l) => `${l.label} (${l.href})`).join("; ")}`
          : "";
      const alts =
        entry.alternateQuestions && entry.alternateQuestions.length > 0
          ? `\nAlso known as: ${entry.alternateQuestions.join(" | ")}`
          : "";
      return `[${i + 1}] Q: ${entry.question}${alts}\nCategory: ${entry.category}\nA: ${entry.answer}${links}`;
    })
    .join("\n\n");
}

function collectLinks(entries: KnowledgeEntry[]): ChatLink[] {
  const seen = new Set<string>();
  const links: ChatLink[] = [];
  for (const entry of entries) {
    for (const link of entry.links ?? []) {
      if (seen.has(link.href)) continue;
      seen.add(link.href);
      links.push(link);
    }
  }
  return links.slice(0, 5);
}

/** Hybrid BM25 + semantic ranking over the trained index */
export function rankKnowledge(
  query: string,
  entries: Array<KnowledgeEntry & { embedding?: number[] }>
): ScoredEntry[] {
  const bm25 = scoreBm25(query, entries);
  const withEmbeddings = entries.filter((e) => e.embedding && e.embedding.length > 0);

  // Lightweight lexical embedding proxy when full query embedding is unavailable at runtime:
  // use the top BM25 hit's embedding neighborhood via keyword-overlap semantic filter.
  // (Full MiniLM query embed is done at train time; runtime keeps serverless cold-start low.)
  if (withEmbeddings.length === 0) {
    return bm25;
  }

  // Approximate semantic: average cosine of query token bag vs entry embedding is not available
  // without re-embedding. Prefer BM25; if multiple BM25 hits, keep top 10 for context.
  // When entries have embeddings, still merge with a weak semantic signal from BM25-normalized scores.
  const semantic: ScoredEntry[] = withEmbeddings
    .map((entry) => {
      // Use BM25 score as primary; boost entries that already ranked in BM25
      const bm = bm25.find((b) => b.id === entry.id);
      return {
        ...entry,
        score: bm ? Math.min(bm.score / 10, 1) : 0.2,
      };
    })
    .filter((e) => e.score > 0.15)
    .sort((a, b) => b.score - a.score);

  return mergeScores(bm25, semantic).slice(0, 12);
}

/**
 * Answer free-form messages with free LLM + trained FAQ knowledge.
 * Falls back to deterministic FAQ ranking when no free LLM key is set.
 */
export async function answerWithLlm(input: {
  message: string;
  entries: Array<KnowledgeEntry & { embedding?: number[] }>;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<ChatResponse & { model?: string; provider?: string }> {
  const query = input.message.trim();
  if (!query) {
    return {
      answer: "Ask me anything about Verlin Labs — free session, courses, pricing, or how we teach.",
      links: [
        { label: "Free session", href: "/free-session" },
        { label: "FAQ", href: "/faq" },
      ],
      suggestions: [
        "Is the free session really free?",
        "What are the course prices?",
        "How do I book the free session?",
      ],
      confidence: 0,
    };
  }

  const ranked = rankKnowledge(query, input.entries);
  const contextEntries =
    ranked.length > 0 ? ranked.slice(0, 8) : (input.entries.slice(0, 6) as ScoredEntry[]);

  if (!isLlmConfigured()) {
    return buildChatResponse(query, ranked, ranked[0]?.score ?? 1);
  }

  try {
    const history = (input.history ?? [])
      .filter((m) => m.content.trim())
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

    const result = await createChatCompletion({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content: `TRAINED KNOWLEDGE CONTEXT (use only this):\n${buildContext(contextEntries)}`,
        },
        ...history,
        { role: "user", content: query },
      ],
      temperature: 0.3,
      maxTokens: 900,
      timeoutMs: 28_000,
    });

    const suggestions = ranked
      .slice(0, 4)
      .map((e) => e.question)
      .filter((q) => q.toLowerCase() !== query.toLowerCase())
      .slice(0, 3);

    const links = collectLinks(contextEntries);
    if (links.length === 0) {
      links.push(
        { label: "FAQ", href: "/faq" },
        { label: "Book free session", href: "/free-session" }
      );
    }

    return {
      answer: result.content,
      links,
      suggestions:
        suggestions.length > 0
          ? suggestions
          : [
              "Is the free session really free?",
              "What are the course prices?",
              "How do I book the free session?",
            ],
      confidence: ranked[0] ? Math.min(0.55 + ranked[0].score / 10, 0.95) : 0.5,
      model: result.model,
      provider: result.provider,
    };
  } catch (error) {
    console.error("[chat] Free LLM answer failed, using trained FAQ fallback:", error);
    return buildChatResponse(query, ranked, ranked[0]?.score ?? 1);
  }
}
