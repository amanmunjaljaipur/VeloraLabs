import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { staticPageMetadata } from "@/lib/page-metadata";
import { getTestimonials } from "@/lib/content";
import type { AudienceSlug } from "@/lib/content";
import { Quote } from "lucide-react";
import Link from "next/link";

export const metadata = staticPageMetadata("caseStudies", "/case-studies");

const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Case Studies" }];

const audienceLabel: Record<AudienceSlug, string> = {
  students: "Student",
  engineers: "Engineer",
  professionals: "Product Manager",
};

const audienceHref: Record<AudienceSlug, string> = {
  students: "/courses/students",
  engineers: "/courses/engineers",
  professionals: "/courses/professionals",
};

export default function CaseStudiesPage() {
  const testimonials = getTestimonials();

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/case-studies" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Case studies"
        title="Real learners, in their own words"
        subtitle="These are unedited accounts from students, engineers, and product managers who went through our programs - what changed for them, and why."
        compact
      />

      <section className="section-y pt-0">
        <div className="container-verlin">
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <Card key={t.id} variant="glass" className="flex h-full flex-col p-6 md:p-7">
                <Quote className="h-6 w-6 text-teal/60" aria-hidden="true" />
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-text-secondary">{t.role}</p>
                  </div>
                  <Link
                    href={audienceHref[t.audience]}
                    className="shrink-0 rounded-full bg-accent-teal/10 px-3 py-1 text-xs font-medium text-teal hover:bg-accent-teal/15"
                  >
                    {audienceLabel[t.audience]} track
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-text-secondary">
            Every quote above is a real account from a learner or parent. We don&apos;t publish
            invented statistics - if a number matters to you, ask us directly on a free session
            and we&apos;ll walk you through what past cohorts actually experienced.
          </p>
        </div>
      </section>

      <section className="section-y bg-muted/30">
        <div className="container-verlin text-center">
          <h2 className="section-title">Want a story like this?</h2>
          <p className="section-subtitle mx-auto">
            Every case study above started with a free 2-hour session.
          </p>
          <div className="mt-8">
            <ButtonLink href="/free-session" size="lg" variant="cta" className="shadow-glow-amber">
              Book Free 2-Hour Session
            </ButtonLink>
          </div>
        </div>
      </section>

      <SiteExploreLinks section="programs" title="Explore programs" limit={4} />
    </>
  );
}
