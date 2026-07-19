import { EnrolledLearnerRedirect } from "@/components/free-session/EnrolledLearnerRedirect";
import { FreeSessionBenefits } from "@/components/sections/FreeSessionBenefits";
import { FreeSessionHero } from "@/components/sections/FreeSessionHero";
import { SessionAgenda } from "@/components/sections/SessionAgenda";
import { AudienceCard } from "@/components/sections/AudienceCard";
import { TestimonialCard } from "@/components/sections/TestimonialCard";
import { SessionFaq } from "@/components/sections/SessionFaq";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FreeSessionBooking } from "./FreeSessionBooking";
import { getAudiences, getFreeSession, getTestimonials } from "@/lib/content";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { FaqPageJsonLd } from "@/components/seo/FaqPageJsonLd";
import { FreeSessionEventJsonLd } from "@/components/seo/FreeSessionEventJsonLd";
import { InstructorsSection } from "@/components/sections/InstructorsSection";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import {
  FREE_SESSION_BOOKING_STEPS,
  getFreeSessionHowToSteps,
} from "@/lib/free-session-howto";
import { staticPageMetadata } from "@/lib/page-metadata";

export const metadata = staticPageMetadata("freeSession", "/free-session");

export default function FreeSessionPage() {
  const freeSession = getFreeSession();
  const audiences = getAudiences();
  const testimonials = getTestimonials();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Programs", href: "/programs" },
    { label: "Free Session" },
  ];

  const sessionFaqs = freeSession.faqCategories.flatMap((category) => category.items);

  return (
    <>
      <EnrolledLearnerRedirect />
      <FaqPageJsonLd items={sessionFaqs} path="/free-session" />
      <HowToJsonLd
        name="How to book your free Verlin Labs AI intro session"
        description="Book a free 2-hour live AI session - choose your track, pick a slot, and experience clarity-first teaching."
        path="/free-session"
        steps={FREE_SESSION_BOOKING_STEPS}
        totalTime="PT2H"
      />
      <HowToJsonLd
        name="What happens during the 2-hour Verlin Labs intro session"
        description="A structured live agenda - welcome, mental models, audience-tailored AI deep-dive, hands-on exercise, and Q&A."
        path="/free-session"
        steps={getFreeSessionHowToSteps()}
        totalTime="PT2H"
      />
      <PersonJsonLd />
      <FreeSessionEventJsonLd />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/free-session" />
      <FreeSessionHero headline={freeSession.headline} description={freeSession.description} />

      <div id="book">
        <FreeSessionBooking />
      </div>

      <FreeSessionBenefits benefits={freeSession.benefits} />

      <SessionAgenda agenda={freeSession.agenda} />

      <section className="section-y bg-muted/30">
        <div className="container-verlin">
          <SectionHeader
            eyebrow="Audience paths"
            title="Sessions tailored to your background"
            subtitle="Select your audience type when booking - content adapts for students, engineers, and professionals."
            align="left"
            className="mb-12"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {audiences.map((a) => (
              <AudienceCard
                key={a.slug}
                title={a.title}
                description={a.heroSubtitle}
                icon={a.icon}
                image={a.image}
                href={`/courses/${a.slug}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-verlin">
          <SectionHeader
            eyebrow="Testimonials"
            title="What attendees say"
            align="left"
            className="mb-12"
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <TestimonialCard key={t.id} {...t} />
            ))}
          </div>
        </div>
      </section>

      <SessionFaq categories={freeSession.faqCategories} />
      <InstructorsSection compact />
      <SiteExploreLinks section="programs" excludeHref="/free-session" limit={4} />
      <SiteExploreLinks section="learn" limit={3} />
    </>
  );
}