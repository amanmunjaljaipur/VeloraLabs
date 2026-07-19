import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { TestimonialCard } from "@/components/sections/TestimonialCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getTestimonials } from "@/lib/content";
import { staticPageMetadata } from "@/lib/page-metadata";
import { TestimonialsJsonLd } from "@/components/seo/TestimonialsJsonLd";
import { TrustSignals } from "@/components/sections/TrustSignals";
import type { AudienceSlug } from "@/lib/content";

export const metadata = staticPageMetadata("testimonials", "/testimonials");

const audienceSections: {
  key: AudienceSlug;
  label: string;
  description: string;
}[] = [
  {
    key: "students",
    label: "Students & parents",
    description: "School learners and families building intuition early.",
  },
  {
    key: "engineers",
    label: "Engineers",
    description: "College students connecting theory to practice.",
  },
  {
    key: "professionals",
    label: "Product managers & leaders",
    description: "Professionals evaluating AI with clearer frameworks.",
  },
];

export default function TestimonialsPage() {
  const testimonials = getTestimonials();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Testimonials" },
  ];

  return (
    <>
      <TestimonialsJsonLd />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/testimonials" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Social proof"
        title="What learners are saying"
        subtitle="Real feedback from students, engineers, product managers, and parents who experienced clarity-first learning with Verlin Labs."
        image="/images/hq-testimonials.jpg"
        imageAlt="Learners connecting with clarity-first AI training"
        video="/videos/testimonials.mp4"
        compact
      />

      <section className="section-y">
        <div className="container-verlin !max-w-5xl space-y-14">
          {audienceSections.map((section) => {
            const items = testimonials.filter((t) => t.audience === section.key);

            if (items.length === 0) return null;

            return (
              <div key={section.key}>
                <h2 className="text-xl font-semibold text-foreground">{section.label}</h2>
                <p className="mt-1 text-sm text-text-secondary">{section.description}</p>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {items.map((testimonial) => (
                    <TestimonialCard key={testimonial.id} {...testimonial} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <TrustSignals compact />

      <section className="border-t border-border bg-muted/20 py-12 md:py-16">
        <div className="container-verlin !max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-foreground">See for yourself</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Start with a free 2-hour session - experience how we teach before you commit to a
            full program.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/free-session" size="lg" variant="cta">
              Book free session
            </ButtonLink>
            <ButtonLink href="/programs" size="lg" variant="secondary">
              View programs
            </ButtonLink>
          </div>
        </div>
      </section>

      <SiteExploreLinks section="programs" title="Explore programs" limit={4} />
    </>
  );
}