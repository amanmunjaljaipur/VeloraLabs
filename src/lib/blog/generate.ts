import { createChatCompletion, isLlmConfigured } from "@/lib/chat/llm-client";
import { getBlogSequence } from "@/lib/blog/sequences";
import type { BlogPost, BlogSection } from "@/lib/blog/types";
import { listBlogPosts, uniqueBlogSlug } from "@/lib/blog/store";
import { buildImageSearchQuery, fetchBlogCoverImage } from "@/lib/blog/image-search";

function estimateDuration(sections: BlogSection[]): string {
  const words = sections.reduce((sum, s) => {
    const p = (s.paragraphs ?? []).join(" ").split(/\s+/).length;
    const b = (s.bullets ?? []).join(" ").split(/\s+/).length;
    return sum + p + b;
  }, 0);
  const mins = Math.max(5, Math.min(25, Math.round(words / 180)));
  return `${mins} min`;
}

async function templatePost(input: {
  sequenceId: string;
  customTopic?: string;
  scheduledAt: string | null;
  status: BlogPost["status"];
  createdBy?: string;
}): Promise<BlogPost> {
  const sequence = getBlogSequence(input.sequenceId);
  if (!sequence) {
    throw new Error("Unknown blog sequence");
  }

  const topicBit = input.customTopic?.trim()
    ? input.customTopic.trim()
    : sequence.label;
  const title = `${topicBit}: a clarity-first guide`;
  const existing = await listBlogPosts();
  const slug = uniqueBlogSlug(title, existing);
  const now = new Date().toISOString();
  const publishAt = input.scheduledAt ?? now;

  const coverImage = await fetchBlogCoverImage({
    query: buildImageSearchQuery({
      title,
      tags: sequence.defaultTags,
      sequenceLabel: sequence.label,
    }),
    slug,
  });

  const sections: BlogSection[] = [
    {
      title: "Why this matters",
      paragraphs: [
        `${topicBit} is one of the ideas we return to often at Verlin Labs. Without a clear mental model, AI tools feel magical one day and frustrating the next.`,
        "This article keeps the explanation practical - so students, engineers, and product managers can apply it the same day.",
      ],
    },
    {
      title: "The core idea",
      paragraphs: [
        sequence.topicPrompt.split(".")[0] + ".",
        "When you can name the pattern, you can choose better prompts, better tools, and better evaluation criteria.",
      ],
      bullets: [
        "Name the concept in plain language before using jargon.",
        "Connect it to a real task you already do (homework, code review, PRD).",
        "Define what success looks like - then check the AI output against that bar.",
      ],
    },
    {
      title: "How to apply it today",
      paragraphs: [
        "Pick one workflow this week. Write the goal in one sentence, list constraints, and ask the model only for drafts you will review.",
        "At Verlin Labs we practice this live - clarity first, tools second - so the habit sticks beyond a single chat session.",
      ],
      bullets: [
        "Start with a free session if you want guided practice.",
        "Use the library and mental models hub for deeper frameworks.",
        "Share what you learned with a peer - teaching locks the model in.",
      ],
    },
  ];

  return {
    id: `blog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    slug,
    title,
    description: `A practical Verlin Labs guide on ${topicBit.toLowerCase()} - clarity-first AI learning without the hype.`,
    summary: `Learn ${topicBit.toLowerCase()} with a simple structure you can reuse in school, engineering, or product work.`,
    duration: estimateDuration(sections),
    level: sequence.level,
    audience: sequence.audience,
    type: "Article",
    featured: false,
    image: coverImage ?? sequence.image,
    author: "Verlin Labs",
    publishedAt: publishAt,
    tags: sequence.defaultTags,
    sections,
    keyTakeaway: `${topicBit} becomes useful when you can explain it simply and apply it to one real task the same day.`,
    relatedSlugs: [],
    status: input.status,
    scheduledAt: input.status === "scheduled" ? input.scheduledAt : null,
    sequenceId: sequence.id,
    sequenceLabel: sequence.label,
    generatedBy: "template",
    createdAt: now,
    createdBy: input.createdBy,
  };
}

function parseAiJson(raw: string): {
  title: string;
  description: string;
  summary: string;
  keyTakeaway: string;
  tags?: string[];
  sections: BlogSection[];
} {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced?.[1] ?? raw).trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("AI response was not valid JSON");
  }
  return JSON.parse(text.slice(start, end + 1)) as {
    title: string;
    description: string;
    summary: string;
    keyTakeaway: string;
    tags?: string[];
    sections: BlogSection[];
  };
}

/**
 * Generate a blog post for a sequence using free LLM (Groq/Gemini) when configured.
 * Falls back to a structured template so admin scheduling always works.
 */
export async function generateBlogPost(input: {
  sequenceId: string;
  customTopic?: string;
  scheduledAt?: string | null;
  status?: BlogPost["status"];
  createdBy?: string;
}): Promise<BlogPost> {
  const sequence = getBlogSequence(input.sequenceId);
  if (!sequence) throw new Error("Unknown blog sequence");

  const status = input.status ?? (input.scheduledAt ? "scheduled" : "draft");
  const scheduledAt = status === "scheduled" ? input.scheduledAt ?? null : null;

  if (!isLlmConfigured()) {
    return templatePost({
      sequenceId: input.sequenceId,
      customTopic: input.customTopic,
      scheduledAt,
      status,
      createdBy: input.createdBy,
    });
  }

  const topic = input.customTopic?.trim() || sequence.topicPrompt;
  const recentTitles = (await listBlogPosts())
    .slice(0, 8)
    .map((p) => p.title)
    .join("; ");

  try {
    const { content } = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `You are the Verlin Labs editorial assistant. Write clarity-first educational blog articles for AI learners in India (students, engineers, PMs).
Return ONLY valid JSON with this shape:
{
  "title": string,
  "description": string (max 160 chars),
  "summary": string (1-2 sentences),
  "keyTakeaway": string,
  "tags": string[] (3-5),
  "sections": [
    { "title": string, "paragraphs": string[], "bullets": string[] (optional) }
  ]
}
Rules: 3-5 sections, practical tone, no hype, no invented product claims, no markdown fences if possible.`,
        },
        {
          role: "user",
          content: `Sequence: ${sequence.label}
Audience: ${sequence.audience}
Level: ${sequence.level}
Topic brief: ${topic}
Avoid repeating these recent titles: ${recentTitles || "none"}
Write a fresh article for the Verlin Labs blog.`,
        },
      ],
      temperature: 0.55,
      maxTokens: 2500,
      timeoutMs: 45000,
    });

    const parsed = parseAiJson(content);
    if (!parsed.title || !parsed.sections?.length) {
      throw new Error("Incomplete AI article");
    }

    const existing = await listBlogPosts();
    const slug = uniqueBlogSlug(parsed.title, existing);
    const now = new Date().toISOString();
    const publishAt = scheduledAt ?? now;
    const tags = parsed.tags?.length ? parsed.tags.slice(0, 6) : sequence.defaultTags;

    const coverImage = await fetchBlogCoverImage({
      query: buildImageSearchQuery({
        title: parsed.title,
        tags,
        sequenceLabel: sequence.label,
      }),
      slug,
    });

    return {
      id: `blog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      slug,
      title: parsed.title.trim(),
      description: (parsed.description || parsed.summary || parsed.title).slice(0, 200),
      summary: parsed.summary || parsed.description || "",
      duration: estimateDuration(parsed.sections),
      level: sequence.level,
      audience: sequence.audience,
      type: "Article",
      featured: false,
      image: coverImage ?? sequence.image,
      author: "Verlin Labs",
      publishedAt: publishAt,
      tags,
      sections: parsed.sections.map((s) => ({
        title: s.title,
        paragraphs: s.paragraphs ?? [],
        bullets: s.bullets,
      })),
      keyTakeaway: parsed.keyTakeaway || parsed.summary || parsed.title,
      relatedSlugs: [],
      status,
      scheduledAt: status === "scheduled" ? scheduledAt : null,
      sequenceId: sequence.id,
      sequenceLabel: sequence.label,
      generatedBy: "ai",
      createdAt: now,
      createdBy: input.createdBy,
    };
  } catch (error) {
    console.error("[blog] AI generate failed, using template:", error);
    return templatePost({
      sequenceId: input.sequenceId,
      customTopic: input.customTopic,
      scheduledAt,
      status,
      createdBy: input.createdBy,
    });
  }
}

