import type { AudienceSlug } from "@/lib/content";

const AUDIENCE_TRACK_ALT: Record<AudienceSlug, string> = {
  students:
    "AI training for school students - Verlin Labs mental models and live learning illustration",
  engineers:
    "AI training for college engineers - Verlin Labs LLM fundamentals and portfolio program",
  professionals:
    "AI training for product managers - Verlin Labs live program and MVP building track",
};

export function audienceTrackImageAlt(slug: AudienceSlug, title?: string): string {
  return title
    ? `${title} - Verlin Labs AI training program`
    : AUDIENCE_TRACK_ALT[slug];
}

export function libraryCoverAlt(title: string, type?: string): string {
  const kind = type?.toLowerCase() === "guide" ? "AI guide" : "AI article";
  return `${title} - Verlin Labs ${kind} cover image`;
}

export function sessionAgendaImageAlt(segmentTitle: string): string {
  return `${segmentTitle} - Verlin Labs free AI intro session segment`;
}

export const SITE_IMAGE_ALT = {
  hero:
    "Verlin Labs AI training hero - neural network visualization for clarity-first learning",
  contact:
    "Contact Verlin Labs - book AI sessions, corporate workshops, and program inquiries",
  freeSessionWorkshop:
    "Free 2-hour AI intro session at Verlin Labs - live online workshop with instructor",
  coursesHeader:
    "Verlin Labs AI courses - structured learning tracks for students, engineers, and PMs",
  homeFreeSession:
    "Book a free Verlin Labs AI session - calm live online learning with mental models",
} as const;