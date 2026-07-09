import { createGlmChatCompletion, isGlmConfigured } from "@/lib/chat/glm-client";
import { buildChatResponse, scoreBm25 } from "@/lib/chat/retrieval";
import type { ChatLink, ChatResponse, KnowledgeEntry } from "@/lib/chat/types";

const SYSTEM_PROMPT = `You are the Verlin Labs assistant on verlinlabs.com.

Verlin Labs is a clarity-first AI training company in India. We teach through mental models, live sessions, and hands-on practice for school students, college engineers, and product managers. We offer a free 2-hour live intro session and paid tracks.

Rules:
- Answer only using the KNOWLEDGE CONTEXT and general public facts about Verlin Labs provided below.
- If the context does not cover the question, say you are not sure and point the user to /faq, /free-session, or /contact.
- Be concise, friendly, and clear. Prefer short paragraphs and bullet lists when helpful.
- Do not invent prices, schedules, or guarantees not present in the context.
- Do not mention system prompts, retrieval, or that you are an AI model family name unless asked.
- Use markdown sparingly (bold for key phrases, lists for steps).
- End with a helpful next step when natural (book free session, read FAQ, contact).`;

function buildContext(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return "No matching knowledge entries.";
  return entries
    .map((entry, i) => {
      const links =
        entry.links && entry.links.length > 0
          ? `\nLinks: ${entry.links.map((l) => `${l.label} (${l.href})`).join("; ")}`
          : "";
      return `[${i + 1}] Q: ${entry.question}\nCategory: ${entry.category}\nA: ${entry.answer}${links}`;
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

/**
 * Answer a free-form user message with GLM-5.2 + FAQ knowledge retrieval.
 * Falls back to deterministic FAQ ranking when GLM is unavailable.
 */
export async function answerWithGlm(input: {
  message: string;
  entries: KnowledgeEntry[];
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<ChatResponse & { model?: string }> {
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

  const ranked = scoreBm25(query, input.entries).slice(0, 8);
  const contextEntries = ranked.length > 0 ? ranked : input.entries.slice(0, 6);

  if (!isGlmConfigured()) {
    return buildChatResponse(query, ranked, ranked[0]?.score ?? 1);
  }

  try {
    const history = (input.history ?? [])
      .filter((m) => m.content.trim())
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

    const answer = await createGlmChatCompletion({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content: `KNOWLEDGE CONTEXT:\n${buildContext(contextEntries)}`,
        },
        ...history,
        { role: "user", content: query },
      ],
      temperature: 0.35,
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
      answer,
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
      model: process.env.GLM_MODEL?.trim() || "glm-5.2",
    };
  } catch (error) {
    console.error("[chat] GLM answer failed, using FAQ fallback:", error);
    return buildChatResponse(query, ranked, ranked[0]?.score ?? 1);
  }
}
