import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { CoursePrice } from "@/components/ui/CoursePrice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { isEnrolledLearner } from "@/lib/enrollment";
import { getAllCourseTracks } from "@/lib/content";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, Code, GraduationCap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description: "Clarity-first learning courses for school students, college engineers, and product managers.",
};

const icons = {
  students: GraduationCap,
  engineers: Code,
  professionals: Briefcase,
};

const labels = {
  students: "School Students (Classes 6–12)",
  engineers: "College Engineers",
  professionals: "Product Managers",
};

const trackImages = {
  students: "/images/audience-students-illustration.jpg",
  engineers: "/images/audience-engineers-illustration.jpg",
  professionals: "/images/audience-professionals-illustration.jpg",
};

export default async function CoursesPage() {
  const tracks = getAllCourseTracks();
  const session = await auth();
  const isEnrolled = session?.user
    ? isEnrolledLearner(session.user.email, session.user.role)
    : false;

  return (
    <>
      <PageHeader
        eyebrow="Learning tracks"
        title="Courses"
        subtitle={
          isEnrolled
            ? "Browse all Verlin Labs courses, or go to My Course to continue your enrolled track."
            : "Choose the course that fits your stage — each track includes the full syllabus and session structure."
        }
        image="/images/presentation.jpg"
        imageAlt="Structured learning courses"
      />

      {isEnrolled && (
        <section className="border-b border-border bg-teal/5">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center md:px-8">
            <div>
              <p className="text-sm font-medium text-teal">You&apos;re enrolled</p>
              <p className="mt-1 text-sm text-text-secondary">
                Open My Course to view your syllabus and session recordings.
              </p>
            </div>
            <Link href="/my-course">
              <Button size="sm">My Course</Button>
            </Link>
          </div>
        </section>
      )}

      <section className="section-y">
        <div className="container-verlin">
          <div className="grid gap-6 md:grid-cols-3">
            {tracks.map(({ slug, course }) => {
              const Icon = icons[slug];
              const dayCount = course.phases.reduce((sum, p) => sum + p.days.length, 0);
              return (
                <Link key={slug} href={`/courses/${slug}`} className="block h-full group">
                  <Card hover className="flex h-full flex-col overflow-hidden p-0">
                    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-accent-teal/5 via-background to-sky-50/40">
                      <Image
                        src={trackImages[slug]}
                        alt=""
                        fill
                        className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="400px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-card/90 text-accent-teal shadow-sm backdrop-blur-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6 md:p-8">
                    <p className="text-xs font-medium text-teal uppercase tracking-wider">
                      {labels[slug]}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">{course.title}</h3>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed flex-1">
                      {course.description}
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <div>
                        {!isEnrolled && <CoursePrice price={course.price} size="sm" />}
                        <p className="text-xs text-text-secondary">
                          {course.duration} · {dayCount} days
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-medium text-teal transition-all group-hover:gap-2">
                        {isEnrolled ? "View syllabus" : "View course"}{" "}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {!isEnrolled && (
        <section className="section-y bg-muted/30">
          <div className="container-verlin">
            <SectionHeader
              eyebrow="Get started"
              title="Not sure which program fits?"
              subtitle="Start with a free 2-hour session — we'll help you pick the right path."
              className="mb-8"
            />
            <div className="text-center">
              <ButtonLink href="/free-session" size="lg" variant="cta" className="shadow-glow-amber">
                Book Free 2-Hour Session
              </ButtonLink>
              <p className="mt-2 text-xs text-text-muted">No commitment · We&apos;ll help you choose</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}