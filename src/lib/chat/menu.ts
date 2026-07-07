import { formatAnswer } from "@/lib/chat/retrieval";
import type { ChatMenu, ChatMenuCategory, ChatResponse, KnowledgeEntry } from "@/lib/chat/types";

const CATEGORY_ORDER = [
  "General",
  "Free Session",
  "About the session",
  "Before you book",
  "Booking & next steps",
  "Pricing",
  "Courses & Tracks",
  "Courses",
  "Learning",
  "Learning Experience",
  "For Teams & Organizations",
  "Technical & Logistics",
  "Resources",
  "Newsletter",
  "Contact",
  "Home",
];

function categorySortIndex(name: string): number {
  const index = CATEGORY_ORDER.indexOf(name);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

export function buildChatMenu(entries: KnowledgeEntry[]): ChatMenu {
  const byCategory = new Map<string, KnowledgeEntry[]>();

  for (const entry of entries) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }

  const categories: ChatMenuCategory[] = Array.from(byCategory.entries())
    .sort(([a], [b]) => {
      const orderDiff = categorySortIndex(a) - categorySortIndex(b);
      return orderDiff !== 0 ? orderDiff : a.localeCompare(b);
    })
    .map(([name, items]) => ({
      name,
      questions: items
        .slice()
        .sort((a, b) => a.question.localeCompare(b.question))
        .map((entry) => ({ id: entry.id, question: entry.question })),
    }));

  return { categories };
}

export function getEntryAnswer(entryId: string, entries: KnowledgeEntry[]): ChatResponse | null {
  const entry = entries.find((item) => item.id === entryId);
  if (!entry) return null;

  const related = entries
    .filter((item) => item.category === entry.category && item.id !== entry.id)
    .slice(0, 3)
    .map((item) => item.question);

  return {
    answer: formatAnswer(entry),
    links: entry.links,
    suggestions: related,
    confidence: 1,
  };
}