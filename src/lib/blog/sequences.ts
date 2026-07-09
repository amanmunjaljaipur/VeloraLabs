import type { BlogSequence } from "@/lib/blog/types";

/**
 * Admin-selectable content sequences for scheduled AI blog posts.
 * Order = recommended daily rotation for the scheduler UI.
 */
export const BLOG_SEQUENCES: BlogSequence[] = [
  {
    id: "mental-models",
    label: "Mental Models",
    description: "Clarity-first frameworks for thinking about AI",
    topicPrompt:
      "Write about one practical mental model for understanding or using AI (e.g. map vs territory, abstraction ladder, feedback loops, constraint boxes). Teach clearly for students and professionals in India.",
    defaultTags: ["Mental models", "Fundamentals", "Clarity"],
    audience: "all",
    level: "Beginner",
    image: "/images/thumb-how-llms-work.jpg",
  },
  {
    id: "llm-fundamentals",
    label: "LLM Fundamentals",
    description: "How models, tokens, and prompts actually work",
    topicPrompt:
      "Explain one core LLM concept (tokens, context windows, temperature, hallucinations, system prompts) without heavy math. Practical examples for learners.",
    defaultTags: ["LLMs", "Fundamentals", "Tokens"],
    audience: "all",
    level: "Beginner",
    image: "/images/thumb-how-llms-work.jpg",
  },
  {
    id: "students",
    label: "AI for Students",
    description: "Safe, useful AI habits for Classes 6–12",
    topicPrompt:
      "Write a guide for school students (Classes 6–12) on using AI safely and effectively for learning — not cheating. Practical tips parents and teachers would approve of.",
    defaultTags: ["Students", "Safe AI use", "Learning"],
    audience: "students",
    level: "Beginner",
    image: "/images/students.jpg",
  },
  {
    id: "engineers",
    label: "AI for Engineers",
    description: "Builders, RAG, tools, and portfolio-minded practice",
    topicPrompt:
      "Write for college and early-career engineers: one practical AI engineering topic (RAG, embeddings, evals, tool use, prompt design for code). Actionable and project-oriented.",
    defaultTags: ["Engineering", "RAG", "Builders"],
    audience: "engineers",
    level: "Intermediate",
    image: "/images/engineers.jpg",
  },
  {
    id: "product",
    label: "AI for Product Managers",
    description: "Discovery, specs, and decision frameworks for PMs",
    topicPrompt:
      "Write for product managers: how to use AI for discovery, PRDs, prioritisation, or vendor evaluation without becoming a pure prompt engineer. Clarity-first PM language.",
    defaultTags: ["Product", "PM", "Decision frameworks"],
    audience: "professionals",
    level: "Intermediate",
    image: "/images/professionals.jpg",
  },
  {
    id: "practice",
    label: "Practice & Workflows",
    description: "Daily habits, evals, and real-world application",
    topicPrompt:
      "Write about a practical AI workflow or habit (review checklist, critique loop, note-taking with AI, team norms). Emphasize judgment over tool hype.",
    defaultTags: ["Practice", "Workflows", "Productivity"],
    audience: "all",
    level: "Intermediate",
    image: "/images/workshop.jpg",
  },
];

export function getBlogSequence(id: string): BlogSequence | undefined {
  return BLOG_SEQUENCES.find((s) => s.id === id);
}

/** Recommend next sequence for daily rotation based on last published sequence */
export function suggestNextSequenceId(lastSequenceId?: string | null): string {
  if (!lastSequenceId) return BLOG_SEQUENCES[0]!.id;
  const idx = BLOG_SEQUENCES.findIndex((s) => s.id === lastSequenceId);
  if (idx < 0) return BLOG_SEQUENCES[0]!.id;
  return BLOG_SEQUENCES[(idx + 1) % BLOG_SEQUENCES.length]!.id;
}
