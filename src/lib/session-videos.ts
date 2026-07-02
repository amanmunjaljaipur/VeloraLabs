import { readJsonFile, writeJsonFile } from "@/lib/data-store";
import {
  getAllCourseTracks,
  getCourseTrack,
  type AudienceSlug,
  type CourseDay,
} from "@/lib/content";
import { extractYouTubeId } from "@/lib/youtube";

export interface SessionVideoRecord {
  youtubeUrl: string;
  youtubeId: string;
  updatedAt: string;
  updatedBy: string;
}

export interface SessionMeta {
  id: string;
  audience: AudienceSlug;
  day: number;
  title: string;
  description: string;
  phaseTitle: string;
}

type SessionVideosConfig = Record<string, SessionVideoRecord>;

const VIDEOS_FILE = "session-videos.json";

function readVideosFile(): SessionVideosConfig {
  return readJsonFile<SessionVideosConfig>(VIDEOS_FILE, "{}");
}

function writeVideosFile(videos: SessionVideosConfig): void {
  writeJsonFile(VIDEOS_FILE, videos, "{}");
}

export function buildSessionId(audience: AudienceSlug, day: number): string {
  return `${audience}-day-${day}`;
}

export function parseSessionId(sessionId: string): { audience: AudienceSlug; day: number } | null {
  const match = sessionId.match(/^(students|engineers|professionals)-day-(\d+)$/);
  if (!match) return null;
  return {
    audience: match[1] as AudienceSlug,
    day: Number.parseInt(match[2], 10),
  };
}

export function getSessionMeta(sessionId: string): SessionMeta | null {
  const parsed = parseSessionId(sessionId);
  if (!parsed) return null;

  const course = getCourseTrack(parsed.audience);
  for (const phase of course.phases) {
    const day = phase.days.find((d) => d.day === parsed.day);
    if (day) {
      return {
        id: sessionId,
        audience: parsed.audience,
        day: parsed.day,
        title: day.title,
        description: day.description,
        phaseTitle: phase.title,
      };
    }
  }
  return null;
}

export function getAllSessionMetas(): SessionMeta[] {
  const sessions: SessionMeta[] = [];
  for (const { slug, course } of getAllCourseTracks()) {
    for (const phase of course.phases) {
      for (const day of phase.days) {
        sessions.push({
          id: buildSessionId(slug, day.day),
          audience: slug,
          day: day.day,
          title: day.title,
          description: day.description,
          phaseTitle: phase.title,
        });
      }
    }
  }
  return sessions.sort((a, b) => a.id.localeCompare(b.id));
}

export function getSessionVideo(sessionId: string): SessionVideoRecord | null {
  const videos = readVideosFile();
  return videos[sessionId] ?? null;
}

export function getAllSessionVideos(): SessionVideosConfig {
  return readVideosFile();
}

export function setSessionVideo(
  sessionId: string,
  youtubeUrl: string,
  updatedBy: string
): SessionVideoRecord {
  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) {
    throw new Error("Invalid YouTube URL");
  }

  const videos = readVideosFile();
  const record: SessionVideoRecord = {
    youtubeUrl: youtubeUrl.trim(),
    youtubeId,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  videos[sessionId] = record;
  writeVideosFile(videos);
  return record;
}

export function removeSessionVideo(sessionId: string): boolean {
  const videos = readVideosFile();
  if (!(sessionId in videos)) return false;
  delete videos[sessionId];
  writeVideosFile(videos);
  return true;
}

export function getDayFromCourse(audience: AudienceSlug, dayNumber: number): CourseDay | null {
  const course = getCourseTrack(audience);
  for (const phase of course.phases) {
    const day = phase.days.find((d) => d.day === dayNumber);
    if (day) return day;
  }
  return null;
}