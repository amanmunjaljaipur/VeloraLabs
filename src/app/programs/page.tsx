import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoursePrice } from "@/components/ui/CoursePrice";
import { getAllCourseTracks } from "@/lib/content";
import { InstructorsSection } from "@/components/sections/InstructorsSection";
import { CoursesGraphJsonLd } from "@/components/seo/CoursesGraphJsonLd";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import { getHomeContentData } from "@/lib/cms/home-content-data";
import { staticPageMetadata } from "@/lib/page-metadata";
import {
  Briefcase,
  Building2,
  Calendar,
  Code,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { SeoRichTextSection } from "@/components/seo/SeoRichTextSection";
import { PROGRAMS_SEO_BLOCK } from "@/lib/seo-content";

export const metadata = staticPageMetadata("programs", "/programs");

const trackIcons: Record<string, LucideIcon> = {
  students: GraduationCap,
  engineers: Code,
  professionals: Briefcase,
};

const trackLabels: Record<string, string> = {
  students: "School Students (Classes 6–12)",
  engineers: "College Engineers",
  professionals: "Product Managers",
};

export default function ProgramsPage() {
  const tracks = getAllCourseTracks();
  const howItWorks = getHomeContentData().howItWorks;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Programs" },
  ];

  return (
    <>
      <CoursesGraphJsonLd />
      <HowToJsonLd
        name="How Verlin Labs programs work - from free session to demo day"
        description="Four clear steps from your free intro session through mental models, hands-on projects, and capstone demo day."
        path="/programs"
        steps={howItWorks.map((step) => ({
          name: step.title,
          text: step.description,
        }))}
      />
      <PersonJsonLd />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/programs" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="What we offer"
        title="Programs & Offerings"
        subtitle="Every path starts with clarity - from a free introductory session to full learning tracks and team workshops."
        image="/images/hq-programs.jpg"
        imageAlt="Programs path from free session to demo day"
        video="/videos/programs.mp4"
        compact
      />

      <section className="section-y">
        <div className="container-verlin !max-w-5xl space-y-12">
          <Card className="border-accent-teal/25 bg-gradient-to-br from-accent-teal/5 to-transparent p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-accent-teal">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider">
                    Start here
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  Free 2-hour introductory session
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Experience how we teach - live, structured, and tailored to your background.
                  No payment required. The best way to decide which program fits you.
                </p>
              </div>
              <Link href="/free-session" className="shrink-0">
                <Button size="lg" variant="cta">
                  <Calendar className="mr-2 h-4 w-4" />
                  Book free session
                </Button>
              </Link>
            </div>
          </Card>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">Paid learning tracks</h2>
            <p className="mt-2 max-w-2xl text-text-secondary leading-relaxed">
              Cohort-based programs built around mental models, live sessions, and hands-on
              practice - designed separately for students, engineers, and product leaders.
            </p>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {tracks.map(({ slug, course }) => {
                const Icon = trackIcons[slug];
                const dayCount = course.phases.reduce((sum, p) => sum + p.days.length, 0);
                return (
                  <Link
                    key={slug}
                    href={
                      slug === "students"
                        ? "/ai-for-students"
                        : slug === "engineers"
                          ? "/ai-for-engineers"
                          : slug === "professionals"
                            ? "/ai-for-pms"
                            : `/courses/${slug}`
                    }
                    className="group block h-full"
                  >
                    <Card hover className="flex h-full flex-col p-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-teal">
                        {trackLabels[slug]}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground group-hover:text-teal">
                        {course.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                        {course.description}
                      </p>
                      <div className="mt-5 space-y-3 border-t border-border pt-4">
                        <CoursePrice price={course.price} size="compact" />
                        <p className="text-xs text-text-secondary">
                          {course.duration} · {dayCount} sessions
                        </p>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
            <p className="mt-6 text-center text-sm text-text-secondary">
              Compare all tracks on the{" "}
              <Link href="/courses" className="font-medium text-teal hover:underline">
                courses page
              </Link>
              .
            </p>
          </div>

          <Card className="p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-accent-teal">
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider">
                    For teams
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  Corporate & team workshops
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Clarity-first AI literacy for organizations - custom pacing, practical
                  frameworks, and follow-up resources for engineering and product teams.
                </p>
              </div>
              <Link href="/corporate" className="shrink-0">
                <Button size="lg" variant="secondary">
                  View corporate workshops
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <InstructorsSection compact />

      <SiteExploreLinks section="learn" title="Free resources" subtitle="Library, mental models, and downloads to support your learning." />
      <SiteExploreLinks section="company" excludeHref="/about" title="Questions?" subtitle="FAQ and contact - we are happy to help you choose the right path." limit={3} />
      <SeoRichTextSection block={PROGRAMS_SEO_BLOCK} />
    </>
  );
}