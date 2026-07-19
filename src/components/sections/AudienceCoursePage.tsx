import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoursePrice } from "@/components/ui/CoursePrice";
import { CourseCurriculum } from "@/components/sections/CourseCurriculum";
import type { AudienceSlug, CourseContent } from "@/lib/content";
import { audienceTrackImageAlt } from "@/lib/image-alt";
import { getAllSessionDocuments } from "@/lib/session-documents";
import { filterCoursePhasesByAccessibleDays } from "@/lib/session-access-grants";
import { buildSessionId, getAllSessionVideos } from "@/lib/session-videos";
import { CheckCircle2 } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import Link from "next/link";

const audienceImages: Record<AudienceSlug, string> = {
  students: "/images/audience-students-illustration.jpg",
  engineers: "/images/audience-engineers-illustration.jpg",
  professionals: "/images/audience-professionals-illustration.jpg",
};

const audienceLabels: Record<AudienceSlug, string> = {
  students: "For School Students (Classes 6–12)",
  engineers: "For College Engineers",
  professionals: "For Product Managers",
};

interface AudienceCoursePageProps {
  slug: AudienceSlug;
  course: CourseContent;
  isEnrolled?: boolean;
  videoProgressMap?: Record<string, number>;
  completedDays?: number[];
  accessibleDays?: number[] | "all";
  variant?: "catalog" | "my-course";
}

export function AudienceCoursePage({
  slug,
  course,
  isEnrolled = false,
  videoProgressMap = {},
  completedDays = [],
  accessibleDays = "all",
  variant = "catalog",
}: AudienceCoursePageProps) {
  const isMyCourse = variant === "my-course";
  const visiblePhases = isEnrolled
    ? filterCoursePhasesByAccessibleDays(course.phases, accessibleDays)
    : course.phases;
  const dayCount = visiblePhases.reduce((sum, phase) => sum + phase.days.length, 0);
  const sessionVideos = getAllSessionVideos();
  const sessionDocuments = getAllSessionDocuments();
  const sessionIds = visiblePhases.flatMap((phase) =>
    phase.days.map((day) => buildSessionId(slug, day.day))
  );
  const sessionVideoIds = sessionIds.filter((id) => id in sessionVideos);
  const sessionDocumentIds = sessionIds.filter(
    (id) => (sessionDocuments[id]?.length ?? 0) > 0
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/80">
        <div className="absolute inset-0">
          <OptimizedImage
            src={audienceImages[slug]}
            alt={audienceTrackImageAlt(slug, audienceLabels[slug])}
            fill
            aboveFold
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/94 to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
        </div>
        <div className="pattern-grid absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="container-verlin relative flex flex-col gap-4 py-12 md:py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal uppercase tracking-wider">
              {isMyCourse ? "My Course" : audienceLabels[slug]}
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-foreground">{course.title}</h1>
            <p className="mt-1 text-sm text-text-secondary">{course.duration}</p>
            {!isEnrolled && (
              <div className="mt-4 max-w-xs">
                <CoursePrice price={course.price} size="compact" />
              </div>
            )}
            {isMyCourse && (
              <p className="mt-1 text-sm text-text-secondary">{audienceLabels[slug]}</p>
            )}
            {isEnrolled && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isMyCourse ? "Active enrollment" : "Enrolled"}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {isEnrolled ? (
              <>
                <Link href="/">
                  <Button size="sm">{isMyCourse ? "Go to dashboard" : "Dashboard"}</Button>
                </Link>
                {!isMyCourse && (
                  <Link href="/my-course">
                    <Button size="sm" variant="secondary">My Course</Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href={`/free-session?audience=${slug}`}>
                  <Button size="sm">Book Free Session</Button>
                </Link>
                <Link href="#enroll">
                  <Button size="sm" variant="secondary">Enroll</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section id="curriculum" className="pt-10 pb-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {isMyCourse ? "Syllabus" : `${dayCount}-Day Program Structure`}
              </h2>
              <p className="mt-2 text-text-secondary max-w-2xl">
                {isMyCourse
                  ? accessibleDays === "all"
                    ? `${visiblePhases.length} modules · ${dayCount} lessons - pick up any session below.`
                    : `${dayCount} lesson${dayCount === 1 ? "" : "s"} available to you - open a module to watch the video or training document.`
                  : course.description}
              </p>
            </div>
            <p className="text-sm font-medium text-teal shrink-0">{course.duration}</p>
          </div>
          <CourseCurriculum
            phases={visiblePhases}
            audience={slug}
            sessionVideoIds={sessionVideoIds}
            sessionDocumentIds={sessionDocumentIds}
            videoProgressMap={videoProgressMap}
            completedDays={completedDays}
          />
        </div>
      </section>

      {!isEnrolled && (
        <section id="enroll" className="py-16 md:py-24 bg-muted/30 scroll-mt-20">
          <div className="mx-auto max-w-lg px-4 md:px-8 text-center">
            <Card className="border-teal ring-2 ring-teal/10">
              <p className="text-sm font-medium text-teal uppercase tracking-wider">Full Program</p>
              <div className="mt-4 flex justify-center">
                <CoursePrice price={course.price} size="lg" align="center" />
              </div>
              <p className="mt-2 text-text-secondary">{course.duration}</p>
              <div className="mt-8 flex flex-col gap-3">
                <Link href={`/free-session?audience=${slug}`}>
                  <Button size="lg" className="w-full">Book Free Session First</Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="secondary" className="w-full">Enroll Now - Contact Us</Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>
      )}
    </>
  );
}