import { readCmsJson, readCmsText } from "@/lib/cms/store";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const contentDir = path.join(process.cwd(), "content");

function readJson<T>(filename: string): T {
  return readCmsJson<T>(filename);
}

export type AudienceSlug = "students" | "engineers" | "professionals";

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  nav: { label: string; href: string }[];
  footer: {
    tagline: string;
    contact?: {
      email: string;
      phone?: string;
      location: string;
      responseNote?: string;
    };
    social: { label: string; href: string }[];
  };
  newsletter: { title: string; description: string; cta: string };
}

export interface Audience {
  slug: AudienceSlug;
  title: string;
  shortTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  tone: string;
  benefits: string[];
  examples: string[];
  icon: string;
  image: string;
}

export interface AgendaItem {
  time: string;
  title: string;
  description: string;
  duration?: string;
  image?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  bullets?: string[];
}

export interface FaqCategory {
  title: string;
  description: string;
  items: FaqItem[];
}

export interface FreeSessionContent {
  headline: string;
  description: string;
  benefits: { title: string; description: string }[];
  agenda: AgendaItem[];
  faqCategories: FaqCategory[];
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  audience: AudienceSlug;
  image?: string | null;
}

export interface TrainerProfile {
  name: string;
  title: string;
  tagline: string;
  image: string;
  imageAlt: string;
  linkedin: string;
  bio: string[];
  expertise: string[];
  credentials: string[];
}

export interface LibrarySection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Optional comparative breakdown table rendered after paragraphs/bullets. */
  table?: {
    headers: string[];
    rows: string[][];
  };
  /** Optional in-line call-to-action box rendered after this section's content. */
  cta?: {
    text: string;
    label: string;
    href: string;
  };
}

export interface LibraryItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  summary: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  audience: AudienceSlug | "all";
  type: "Article" | "Video" | "Workshop" | "Guide";
  featured?: boolean;
  image: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  sections: LibrarySection[];
  keyTakeaway: string;
  relatedSlugs: string[];
}

export interface MentalModelExample {
  title: string;
  description: string;
}

export interface MentalModel {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  readTime: string;
  whyItMatters: string;
  keyPrinciples: string[];
  howToApply: string[];
  examples: MentalModelExample[];
  commonMistakes: string[];
  keyTakeaway: string;
  relatedModelSlugs: string[];
  relatedSlugs: string[];
  publishedAt?: string;
  updatedAt?: string;
}

export interface CourseDay {
  day: number;
  title: string;
  description: string;
  topics?: string[];
  activities?: string[];
  assignment?: string;
}

export interface CoursePhase {
  title: string;
  days: CourseDay[];
}

export interface CourseContent {
  title: string;
  subtitle: string;
  description: string;
  price: string;
  duration: string;
  phases: CoursePhase[];
  audiences: { slug: AudienceSlug; description: string }[];
  comparison: {
    free: { title: string; items: string[] };
    paid: { title: string; items: string[] };
  };
}

export function getSiteConfig() {
  return readJson<SiteConfig>("site.json");
}

export function getAudiences() {
  return readJson<Audience[]>("audiences.json");
}

export function getAudience(slug: string) {
  return getAudiences().find((a) => a.slug === slug);
}

export function getFreeSession() {
  return readJson<FreeSessionContent>("free-session.json");
}

export function getTestimonials(audience?: AudienceSlug) {
  const all = readJson<Testimonial[]>("testimonials.json");
  return audience ? all.filter((t) => t.audience === audience) : all;
}

export function getLeadTrainer() {
  return readJson<TrainerProfile>("trainer.json");
}

export function getLibraryItems() {
  return readJson<LibraryItem[]>("library.json");
}

function contentSortKey(iso: string, updatedAt?: string): string {
  return updatedAt ?? iso;
}

export function getFeaturedLibraryItems(limit = 6) {
  return getLibraryItems()
    .filter((item) => item.featured)
    .sort((a, b) =>
      contentSortKey(b.publishedAt, b.updatedAt).localeCompare(
        contentSortKey(a.publishedAt, a.updatedAt)
      )
    )
    .slice(0, limit);
}

export function getLearnContentLastUpdated(): string | null {
  const stamps = [
    ...getLibraryItems().map((item) => item.updatedAt ?? item.publishedAt),
    ...getMentalModels().map((model) => model.updatedAt ?? model.publishedAt ?? ""),
  ].filter(Boolean);

  if (stamps.length === 0) return null;
  return stamps.sort((a, b) => b.localeCompare(a))[0];
}

export function getLibraryItem(slug: string) {
  return getLibraryItems().find((item) => item.slug === slug);
}

export function getMentalModels() {
  return readJson<MentalModel[]>("mental-models.json");
}

export function getMentalModel(slug: string) {
  return getMentalModels().find((m) => m.slug === slug);
}

const courseFiles: Record<AudienceSlug, string> = {
  students: "courses-students.json",
  engineers: "courses-engineers.json",
  professionals: "courses.json",
};

export function getCourseTrack(slug: AudienceSlug): CourseContent {
  return readJson<CourseContent>(courseFiles[slug]);
}

export function getCourses() {
  return getCourseTrack("professionals");
}

export function getAllCourseTracks(): { slug: AudienceSlug; course: CourseContent }[] {
  return (Object.keys(courseFiles) as AudienceSlug[]).map((slug) => ({
    slug,
    course: getCourseTrack(slug),
  }));
}

export async function getMarkdownPage(filename: string) {
  const file = readCmsText(filename);
  const { data, content } = matter(file);
  const processed = await remark().use(html).process(content);
  return { frontmatter: data as Record<string, string>, html: processed.toString() };
}

const RESOURCE_DOWNLOAD_FILES: Record<string, string> = {
  "free-session-workbook": "resource-free-session-workbook.md",
  "mental-models-cheat-sheet": "resource-mental-models-cheat-sheet.md",
  "ai-glossary": "resource-ai-glossary.md",
};

export function getResourceDownloadSlugs() {
  return Object.keys(RESOURCE_DOWNLOAD_FILES);
}

export interface ResourceDownloadIndexItem {
  slug: string;
  title: string;
  subtitle: string;
  downloadLabel?: string;
}

export function getResourceDownloadsIndex(): ResourceDownloadIndexItem[] {
  return getResourceDownloadSlugs().map((slug) => {
    const filename = RESOURCE_DOWNLOAD_FILES[slug];
    const { data } = matter(readCmsText(filename));
    return {
      slug,
      title: (data.title as string) ?? slug,
      subtitle: (data.subtitle as string) ?? "",
      downloadLabel: data.downloadLabel as string | undefined,
    };
  });
}

export async function getResourceDownload(slug: string) {
  const filename = RESOURCE_DOWNLOAD_FILES[slug];
  if (!filename) return null;
  return getMarkdownPage(filename);
}