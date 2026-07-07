import { auth } from "@/auth";
import { AudienceCoursePage } from "@/components/sections/AudienceCoursePage";
import { getCourseProgress } from "@/lib/course-progress";
import { getCourseTrack } from "@/lib/content";
import { getEnrolledLearnerAudience, isEnrolledLearner } from "@/lib/enrollment";
import { isAdminRole } from "@/lib/session-access";
import { getAllVideoProgressForUser } from "@/lib/video-progress";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Course",
  description: "Your enrolled program — syllabus, session recordings, and learning progress.",
};

export default async function MyCoursePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/my-course");
  }

  if (isAdminRole(session.user.role)) {
    redirect("/admin/sessions");
  }

  if (!isEnrolledLearner(session.user.email, session.user.role)) {
    redirect("/courses");
  }

  const audience = getEnrolledLearnerAudience(session.user.email, session.user.role);
  if (!audience) {
    redirect("/courses");
  }

  const course = getCourseTrack(audience);
  const videoProgressMap: Record<string, number> = {};
  if (session.user.email) {
    const progress = getAllVideoProgressForUser(session.user.email);
    for (const [sessionId, record] of Object.entries(progress)) {
      videoProgressMap[sessionId] = record.percent;
    }
  }
  const completedDays = session.user.email
    ? getCourseProgress(session.user.email).completedDays
    : [];

  return (
    <AudienceCoursePage
      slug={audience}
      course={course}
      isEnrolled
      videoProgressMap={videoProgressMap}
      completedDays={completedDays}
      variant="my-course"
    />
  );
}