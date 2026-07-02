import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { isEnrolledLearner } from "@/lib/enrollment";
import { getAllCourseTracks } from "@/lib/content";
import Link from "next/link";
import { ArrowRight, Briefcase, Code, GraduationCap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programs",
  description: "Clarity-first learning programs for school students, college engineers, and product managers.",
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

export default async function CoursesPage() {
  const tracks = getAllCourseTracks();
  const session = await auth();
  const isEnrolled = session?.user
    ? isEnrolledLearner(session.user.email, session.user.role)
    : false;

  return (
    <>
      <PageHeader
        title="Programs"
        subtitle={
          isEnrolled
            ? "Browse all Verlin Labs programs, or go to My Course to continue your enrolled track."
            : "Choose the program that fits your stage — each track includes the full syllabus and session structure."
        }
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

      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {tracks.map(({ slug, course }) => {
              const Icon = icons[slug];
              const dayCount = course.phases.reduce((sum, p) => sum + p.days.length, 0);
              return (
                <Link key={slug} href={`/for/${slug}`} className="block h-full group">
                  <Card hover className="h-full flex flex-col">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal mb-4 group-hover:bg-teal/20 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-medium text-teal uppercase tracking-wider">
                      {labels[slug]}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">{course.title}</h3>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed flex-1">
                      {course.description}
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <div>
                        {!isEnrolled && (
                          <p className="font-semibold text-foreground">{course.price}</p>
                        )}
                        <p className="text-xs text-text-secondary">
                          {course.duration} · {dayCount} days
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-medium text-teal group-hover:gap-2 transition-all">
                        {isEnrolled ? "View syllabus" : "View program"}{" "}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {!isEnrolled && (
        <section className="py-16 bg-muted/30 text-center">
          <div className="mx-auto max-w-2xl px-4 md:px-8">
            <h2 className="text-2xl font-semibold mb-4">Not sure which program fits?</h2>
            <p className="text-text-secondary mb-8">
              Start with a free 2-hour session — we&apos;ll help you pick the right path.
            </p>
            <Link href="/free-session">
              <Button size="lg">Book Free 2-Hour Session</Button>
            </Link>
          </div>
        </section>
      )}
    </>
  );
}