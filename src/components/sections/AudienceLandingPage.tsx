import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { CoursePrice } from "@/components/ui/CoursePrice";
import { InstructorsSection } from "@/components/sections/InstructorsSection";
import { PageHeader } from "@/components/layout/PageHeader";
import { audienceTrackImageAlt } from "@/lib/image-alt";
import type { AudienceLandingConfig } from "@/lib/audience-landing";
import { getAudience, getCourseTrack } from "@/lib/content";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface AudienceLandingPageProps {
  config: AudienceLandingConfig;
  breadcrumbs: { label: string; href?: string }[];
}

export function AudienceLandingPage({ config, breadcrumbs }: AudienceLandingPageProps) {
  const audience = getAudience(config.slug)!;
  const course = getCourseTrack(config.slug);

  return (
    <>
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow={config.eyebrow}
        title={config.headline}
        subtitle={config.subheadline}
        image={audience.image}
        imageAlt={audienceTrackImageAlt(config.slug, audience.title)}
      />

      <section className="section-y">
        <div className="container-verlin grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Why learners choose this track</h2>
            <ul className="mt-6 space-y-4">
              {config.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-text-secondary">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-teal" aria-hidden />
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/free-session" variant="cta" size="lg">
                Start with free 2-hour session
              </ButtonLink>
              <ButtonLink href={`/courses/${config.slug}`} variant="secondary" size="lg">
                View full course syllabus
              </ButtonLink>
            </div>
          </div>

          <Card className="p-6">
            <div className="relative mb-4 h-40 overflow-hidden rounded-xl bg-gradient-to-br from-accent-teal/5 to-sky-50/40">
              <OptimizedImage
                src={audience.image}
                alt={audienceTrackImageAlt(config.slug)}
                fill
                className="object-contain p-3"
                sizes="340px"
              />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal">Full program</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">{course.title}</h3>
            <p className="mt-2 text-sm text-text-secondary">{course.duration}</p>
            <div className="mt-4 border-t border-border pt-4">
              <CoursePrice price={course.price} size="compact" />
            </div>
          </Card>
        </div>
      </section>

      <section className="section-y border-t border-border/80 bg-muted/20">
        <div className="container-verlin max-w-3xl">
          <h2 className="text-2xl font-semibold text-foreground">Frequently asked questions</h2>
          <p className="mt-2 text-text-secondary">
            Straight answers about this track — booking, expectations, and outcomes.
          </p>
          <div className="mt-8">
            <Accordion items={config.faqs} defaultOpenIndex={0} />
          </div>
          <p className="mt-6 text-center text-sm text-text-secondary">
            More answers on the{" "}
            <Link href="/faq" className="font-medium text-teal hover:underline">
              full FAQ page
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="section-y">
        <div className="container-verlin">
          <h2 className="text-xl font-semibold text-foreground">Related resources</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {config.relatedLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent-teal/40 hover:text-teal"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <InstructorsSection compact />
    </>
  );
}