import { getAudiences, getCourseTrack, type AudienceSlug } from "@/lib/content";
import { CoursePrice } from "@/components/ui/CoursePrice";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Briefcase, Code, GraduationCap } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const icons: Record<AudienceSlug, LucideIcon> = {
  students: GraduationCap,
  engineers: Code,
  professionals: Briefcase,
};

const linkLabels: Record<AudienceSlug, string> = {
  students: "AI training for school students",
  engineers: "AI course for college engineers",
  professionals: "How to learn AI for product management",
};

interface CourseTrackLinksProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function CourseTrackLinks({
  title = "Apply mental models in a live program",
  subtitle = "Each track turns frameworks into hands-on projects, mentor feedback, and a capstone demo - pick the path that matches your role.",
  className,
}: CourseTrackLinksProps) {
  const audiences = getAudiences();

  return (
    <section className={className ?? "section-y border-t border-border bg-muted/20"}>
      <div className="container-verlin">
        <h2 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
          {subtitle}
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {audiences.map((audience) => {
            const course = getCourseTrack(audience.slug);
            const Icon = icons[audience.slug];
            return (
              <Link
                key={audience.slug}
                href={
                  audience.slug === "students"
                    ? "/ai-for-students"
                    : audience.slug === "engineers"
                      ? "/ai-for-engineers"
                      : "/ai-for-pms"
                }
                className="group block h-full"
              >
                <Card hover className="flex h-full flex-col p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-accent-teal">
                    {linkLabels[audience.slug]}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground group-hover:text-teal">
                    {audience.shortTitle} track
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                    {course.description}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                    <span>{course.duration}</span>
                    <CoursePrice price={course.price} />
                  </div>
                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal">
                    View {audience.shortTitle.toLowerCase()} program
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-text-secondary">
          Not sure which track fits?{" "}
          <Link href="/free-session" className="font-medium text-teal hover:underline">
            Start with a free 2-hour session
          </Link>{" "}
          or read our guide{" "}
          <Link
            href="/library/how-to-learn-ai-for-product-management"
            className="font-medium text-teal hover:underline"
          >
            How to learn AI for product management
          </Link>
          .
        </p>
      </div>
    </section>
  );
}