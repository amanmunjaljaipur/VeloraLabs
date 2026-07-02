import { auth } from "@/auth";
import { getAllCourseTracks, type AudienceSlug } from "@/lib/content";
import { buildSessionId, getAllSessionVideos } from "@/lib/session-videos";
import { isAdminRole } from "@/lib/session-access";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const videos = getAllSessionVideos();
  const tracks = getAllCourseTracks();

  const programs = tracks.map(({ slug, course }) => {
    const phases = course.phases.map((phase) => ({
      title: phase.title,
      sessions: phase.days.map((day) => {
        const id = buildSessionId(slug, day.day);
        return {
          id,
          audience: slug,
          day: day.day,
          title: day.title,
          description: day.description,
          phaseTitle: phase.title,
          hasVideo: id in videos,
          video: videos[id] ?? null,
        };
      }),
    }));

    const allSessions = phases.flatMap((phase) => phase.sessions);

    return {
      slug,
      title: course.title,
      description: course.description,
      duration: course.duration,
      videoCount: allSessions.filter((s) => s.hasVideo).length,
      totalSessions: allSessions.length,
      phases,
    };
  });

  const totals = programs.reduce(
    (acc, program) => ({
      videoCount: acc.videoCount + program.videoCount,
      totalSessions: acc.totalSessions + program.totalSessions,
    }),
    { videoCount: 0, totalSessions: 0 }
  );

  // Flat list kept for backward compatibility
  const sessions = programs.flatMap((program) =>
    program.phases.flatMap((phase) => phase.sessions)
  );

  return NextResponse.json({ programs, sessions, totals });
}