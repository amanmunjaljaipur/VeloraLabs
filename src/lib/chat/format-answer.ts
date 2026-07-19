import { buildPricingTableMarkdown } from "./pricing-table";
import type { KnowledgeEntry } from "./types";

const PRICING_HINT =
  /\b(₹|price|pricing|introductory|list\s*₹|rupees|inr|cost|fee)\b/i;

function isPricingEntry(entry: KnowledgeEntry): boolean {
  const haystack = `${entry.question} ${entry.category} ${entry.id} ${entry.answer}`;
  return entry.category === "Pricing" || PRICING_HINT.test(haystack);
}

/** Split run-on FAQ text into readable paragraphs. */
function splitIntoParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.includes("\n\n")) {
    return trimmed
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  // "Sentence. Label: detail. Label: detail." → separate blocks
  const labeledChunks = trimmed.split(/(?<=\.)\s+(?=[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:\s)/);
  if (labeledChunks.length > 1) {
    return labeledChunks.map((p) => p.trim()).filter(Boolean);
  }

  // "Part one. Part two. Part three." with 3+ sentences → one paragraph per sentence group
  const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [trimmed];
  if (sentences.length <= 2) {
    return [trimmed];
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(" ").trim());
  }
  return paragraphs.filter(Boolean);
}

/** Pull inline bullet lines out of answer text (e.g. lines starting with - or •). */
function extractInlineList(text: string): { prose: string; listItems: string[] } {
  const lines = text.split("\n");
  const proseLines: string[] = [];
  const listItems: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/);
    const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]!);
    } else if (numberedMatch) {
      listItems.push(numberedMatch[1]!);
    } else if (trimmed) {
      proseLines.push(trimmed);
    }
  }

  return {
    prose: proseLines.join(" ").trim(),
    listItems,
  };
}

function stripPricingTableFromText(text: string): string {
  return text
    .replace(/\|[^\n]+\|/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * Turn a knowledge entry into display-ready markdown (paragraphs, lists, tables).
 */
export function formatKnowledgeAnswer(entry: KnowledgeEntry): string {
  const blocks: string[] = [];

  let answerText = stripPricingTableFromText(entry.answer.trim());
  const { prose: inlineProse, listItems: inlineList } = extractInlineList(answerText);
  if (inlineList.length > 0) {
    answerText = inlineProse;
  }

  if (isPricingEntry(entry)) {
    const intro = answerText.split(/(?=[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:\s*₹)/)[0]?.trim();
    if (intro && !intro.match(/₹/)) {
      blocks.push(...splitIntoParagraphs(intro));
    } else if (intro) {
      blocks.push(...splitIntoParagraphs(intro));
    } else {
      blocks.push("Current introductory program pricing across all tracks:");
    }
    blocks.push(buildPricingTableMarkdown());
    blocks.push("The **free 2-hour introductory session** is always free - no payment required to book.");
  } else {
    blocks.push(...splitIntoParagraphs(answerText));
  }

  const allBullets = [...(entry.bullets ?? []), ...inlineList];
  if (allBullets.length > 0) {
    blocks.push(allBullets.map((b) => `- ${b}`).join("\n"));
  }

  return blocks.filter(Boolean).join("\n\n");
}