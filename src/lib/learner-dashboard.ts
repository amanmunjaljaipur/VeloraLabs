import type { AudienceSlug, CourseContent } from "@/lib/content";
import { getCourseTrack } from "@/lib/content";
import { getCourseProgress } from "@/lib/course-progress";
import { getEnrolledLearnerAudience } from "@/lib/enrollment";
import {
  filterCoursePhasesByAccessibleDays,
  getAccessibleSessionDays,
} from "@/lib/session-access-grants";
import { buildSessionId, getAllSessionVideos } from "@/lib/session-videos";
import { getAllSessionDocuments } from "@/lib/session-documents";
import { getAllVideoProgressForUser } from "@/lib/video-progress";
import type { UserRole } from "@/types/roles";

export interface ModuleProgress {
  title: string;
  completedDays: number;
  totalDays: number;
  percent: number;
  days: {
    day: number;
    title: string;
    completed: boolean;
    sessionId: string;
    description: string;
    hasVideo: boolean;
    hasDocument: boolean;
    videoPercent: number;
  }[];
}

export interface LearnerDashboardData {
  audience: AudienceSlug;
  course: CourseContent;
  totalDays: number;
  completedDays: number;
  overallPercent: number;
  modules: ModuleProgress[];
  nextDay: {
    day: number;
    title: string;
    sessionId: string;
    moduleTitle: string;
  } | null;
}

function clampPercent(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function buildLearnerDashboard(
  email: string,
  role: UserRole
): LearnerDashboardData | null {
  const audience = getEnrolledLearnerAudience(email, role);
  if (!audience) return null;

  const course = getCourseTrack(audience);
  const accessibleDays = getAccessibleSessionDays(email, role, audience);
  const visiblePhases = filterCoursePhasesByAccessibleDays(course.phases, accessibleDays);
  const accessibleDaySet =
    accessibleDays === "all"
      ? new Set(visiblePhases.flatMap((phase) => phase.days.map((day) => day.day)))
      : new Set(accessibleDays);

  const progress = getCourseProgress(email);
  const completedSet = new Set(
    progress.completedDays.filter((day) => accessibleDaySet.has(day))
  );
  const sessionVideos = getAllSessionVideos();
  const sessionDocuments = getAllSessionDocuments();
  const videoProgress = getAllVideoProgressForUser(email);

  const modules: ModuleProgress[] = visiblePhases.map((phase) => {
    const days = phase.days.map((day) => {
      const sessionId = buildSessionId(audience, day.day);
      return {
        day: day.day,
        title: day.title,
        completed: completedSet.has(day.day),
        sessionId,
        description: day.description,
        hasVideo: sessionId in sessionVideos,
        hasDocument: sessionId in sessionDocuments,
        videoPercent: completedSet.has(day.day)
          ? 100
          : (videoProgress[sessionId]?.percent ?? 0),
      };
    });

    const completedInModule = days.filter((day) => day.completed).length;

    return {
      title: phase.title,
      completedDays: completedInModule,
      totalDays: days.length,
      percent: clampPercent((completedInModule / days.length) * 100),
      days,
    };
  });

  const totalDays = modules.reduce((sum, module) => sum + module.totalDays, 0);
  const completedDays = completedSet.size;
  const overallPercent = totalDays > 0 ? clampPercent((completedDays / totalDays) * 100) : 0;

  let nextDay: LearnerDashboardData["nextDay"] = null;
  for (const module of modules) {
    const upcoming = module.days.find((day) => !day.completed);
    if (upcoming) {
      nextDay = {
        day: upcoming.day,
        title: upcoming.title,
        sessionId: upcoming.sessionId,
        moduleTitle: module.title,
      };
      break;
    }
  }

  return {
    audience,
    course,
    totalDays,
    completedDays,
    overallPercent,
    modules,
    nextDay,
  };
}