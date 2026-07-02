import { auth } from "@/auth";
import { AudienceCoursePage } from "@/components/sections/AudienceCoursePage";
import { isEnrolledLearner } from "@/lib/enrollment";
import { getAudience, getAudiences, getCourseTrack, type AudienceSlug } from "@/lib/content";
import { getCourseProgress } from "@/lib/course-progress";
import { getAllVideoProgressForUser } from "@/lib/video-progress";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAudiences().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const audience = getAudience(slug);
  if (!audience) return { title: "Not Found" };
  return { title: audience.title, description: audience.heroSubtitle };
}

export default async function AudiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const audience = getAudience(slug);
  if (!audience) notFound();

  const course = getCourseTrack(slug as AudienceSlug);
  const session = await auth();
  const isEnrolled = session?.user
    ? isEnrolledLearner(session.user.email, session.user.role)
    : false;

  const videoProgressMap: Record<string, number> = {};
  let completedDays: number[] = [];
  if (isEnrolled && session?.user?.email) {
    const progress = getAllVideoProgressForUser(session.user.email);
    for (const [sessionId, record] of Object.entries(progress)) {
      videoProgressMap[sessionId] = record.percent;
    }
    completedDays = getCourseProgress(session.user.email).completedDays;
  }

  return (
    <AudienceCoursePage
      slug={slug as AudienceSlug}
      course={course}
      isEnrolled={isEnrolled}
      videoProgressMap={videoProgressMap}
      completedDays={completedDays}
    />
  );
}