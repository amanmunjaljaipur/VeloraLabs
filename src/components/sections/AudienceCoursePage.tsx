import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CourseCurriculum } from "@/components/sections/CourseCurriculum";
import type { AudienceSlug, CourseContent } from "@/lib/content";
import { buildSessionId, getAllSessionVideos } from "@/lib/session-videos";
import Image from "next/image";
import Link from "next/link";

const audienceImages: Record<AudienceSlug, string> = {
  students: "/images/students.jpg",
  engineers: "/images/engineers.jpg",
  professionals: "/images/professionals.jpg",
};

const audienceLabels: Record<AudienceSlug, string> = {
  students: "For School Students (Classes 6–12)",
  engineers: "For College Engineers",
  professionals: "For Product Managers",
};

interface AudienceCoursePageProps {
  slug: AudienceSlug;
  course: CourseContent;
}

export function AudienceCoursePage({ slug, course }: AudienceCoursePageProps) {
  const dayCount = course.phases.reduce((sum, p) => sum + p.days.length, 0);
  const sessionVideos = getAllSessionVideos();
  const sessionVideoIds = course.phases
    .flatMap((phase) => phase.days.map((day) => buildSessionId(slug, day.day)))
    .filter((id) => id in sessionVideos);

  return (
    <>
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0">
          <Image src={audienceImages[slug]} alt="" fill className="object-cover" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/75" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-14 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal uppercase tracking-wider">
              {audienceLabels[slug]}
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-foreground">{course.title}</h1>
            <p className="mt-1 text-sm text-text-secondary">{course.duration}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href={`/free-session?audience=${slug}`}>
              <Button size="sm">Book Free Session</Button>
            </Link>
            <Link href="#enroll">
              <Button size="sm" variant="secondary">Enroll</Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="curriculum" className="pt-10 pb-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {dayCount}-Day Course Structure
              </h2>
              <p className="mt-2 text-text-secondary max-w-2xl">{course.description}</p>
            </div>
            <p className="text-sm font-medium text-teal shrink-0">{course.duration}</p>
          </div>
          <CourseCurriculum
            phases={course.phases}
            audience={slug}
            sessionVideoIds={sessionVideoIds}
          />
        </div>
      </section>

      <section id="enroll" className="py-16 md:py-24 bg-muted/30 scroll-mt-20">
        <div className="mx-auto max-w-lg px-4 md:px-8 text-center">
          <Card className="border-teal ring-2 ring-teal/10">
            <p className="text-sm font-medium text-teal uppercase tracking-wider">Full Program</p>
            <p className="mt-4 text-4xl font-semibold text-foreground">{course.price}</p>
            <p className="mt-2 text-text-secondary">{course.duration}</p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href={`/free-session?audience=${slug}`}>
                <Button size="lg" className="w-full">Book Free Session First</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="w-full">Enroll Now — Contact Us</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}