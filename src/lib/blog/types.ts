import type { AudienceSlug } from "@/lib/content";

export type BlogPostStatus = "draft" | "scheduled" | "published";

export interface BlogSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  summary: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  audience: AudienceSlug | "all";
  type: "Article" | "Guide";
  featured?: boolean;
  image: string;
  author: string;
  /** When the post went live (or will go live if scheduled) */
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  sections: BlogSection[];
  keyTakeaway: string;
  relatedSlugs: string[];
  /** Workflow */
  status: BlogPostStatus;
  /** ISO datetime for scheduled publish */
  scheduledAt: string | null;
  sequenceId: string;
  sequenceLabel: string;
  generatedBy: "ai" | "manual" | "template";
  createdAt: string;
  createdBy?: string;
}

export interface BlogStore {
  version: number;
  updatedAt: string;
  posts: BlogPost[];
}

export interface BlogSequence {
  id: string;
  label: string;
  description: string;
  /** Topic seed for Gen AI */
  topicPrompt: string;
  defaultTags: string[];
  audience: AudienceSlug | "all";
  level: "Beginner" | "Intermediate" | "Advanced";
  image: string;
}
