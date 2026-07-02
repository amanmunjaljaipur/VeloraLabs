import type { AudienceSlug, CourseContent } from "@/lib/content";
import { getCourseTrack } from "@/lib/content";
import { getCourseProgress } from "@/lib/course-progress";
import { getAudienceForRole } from "@/lib/session-access";
import { buildSessionId } from "@/lib/session-videos";
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

export function buildLearnerDashboard(email: string, role: UserRole): LearnerDashboardData | null {
  const audience = getAudienceForRole(role);
  if (!audience) return null;

  const course = getCourseTrack(audience);
  const progress = getCourseProgress(email);
  const completedSet = new Set(progress.completedDays);

  const modules: ModuleProgress[] = course.phases.map((phase) => {
    const days = phase.days.map((day) => ({
      day: day.day,
      title: day.title,
      completed: completedSet.has(day.day),
      sessionId: buildSessionId(audience, day.day),
      description: day.description,
    }));

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
  const completedDays = progress.completedDays.length;
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