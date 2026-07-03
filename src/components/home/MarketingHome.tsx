import { AudienceCard } from "@/components/sections/AudienceCard";
import { ContentCard } from "@/components/sections/ContentCard";
import { HeroSection } from "@/components/sections/HeroSection";
import { HomeFreeSessionForm } from "@/components/sections/HomeFreeSessionForm";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LearningSplit } from "@/components/sections/LearningSplit";
import { Newsletter } from "@/components/sections/Newsletter";
import { StatsBar } from "@/components/sections/StatsBar";
import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { WhatWeCover } from "@/components/sections/WhatWeCover";
import {
  getSiteConfig,
  getAudiences,
  getFeaturedLibraryItems,
  getTestimonials,
} from "@/lib/content";
import { LEARNING_ILLUSTRATIONS } from "@/lib/home-content";
import { MotionStagger, MotionStaggerItem } from "@/components/ui/MotionReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import Link from "next/link";

export function MarketingHome() {
  const site = getSiteConfig();
  const audiences = getAudiences();
  const featured = getFeaturedLibraryItems();
  const testimonials = getTestimonials();

  return (
    <>
      <HeroSection />
      <WhatWeCover />
      <StatsBar />

      <section className="section-y">
        <div className="container-verlin">
          <SectionHeader
            eyebrow="Learning paths"
            title="Who is this for?"
            subtitle="Tailored learning paths for every stage of your journey — from school students to engineers and product managers."
            className="mb-14"
          />
          <MotionStagger className="grid gap-6 md:grid-cols-3">
            {audiences.map((a) => (
              <MotionStaggerItem key={a.slug}>
                <AudienceCard
                  title={a.title}
                  description={a.heroSubtitle}
                  icon={a.icon}
                  image={a.image}
                  href={`/for/${a.slug}`}
                />
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      <section className="section-y bg-muted/30">
        <div className="container-verlin space-y-24">
          <LearningSplit
            title="Learn with mental models, not memorization"
            description="Verlin Labs teaches you frameworks that stick — visual maps for complex AI concepts, live explanation, and audience-tailored pacing so understanding compounds instead of fading."
            image={LEARNING_ILLUSTRATIONS.mentalModels.src}
            imageAlt={LEARNING_ILLUSTRATIONS.mentalModels.alt}
            illustration
            items={[
              "Visual frameworks for complex AI concepts",
              "Live sessions, not passive video dumps",
              "Audience-tailored pacing and examples",
            ]}
          />
          <LearningSplit
            title="Hands-on from day one"
            description="Every program ends with something you build — a mini project, portfolio piece, or working MVP. Real tools, real feedback, real confidence."
            image={LEARNING_ILLUSTRATIONS.handsOn.src}
            imageAlt={LEARNING_ILLUSTRATIONS.handsOn.alt}
            illustration
            reverse
            toolIcons
            items={[
              "Free 2-hour session with live exercises",
              "Capstone demo days for every track",
              "Real tools: ChatGPT, Claude, Lovable, Replit",
            ]}
          />
        </div>
      </section>

      <HomeFreeSessionForm />

      <HowItWorks />

      <section className="section-y">
        <div className="container-verlin">
          <div className="mb-14 flex items-end justify-between gap-6">
            <SectionHeader
              eyebrow="Content library"
              title="Featured content"
              subtitle="Start exploring with our most popular resources."
              align="left"
            />
            <Link
              href="/library"
              className="link-hover hidden shrink-0 text-sm font-medium text-teal sm:block"
            >
              View all →
            </Link>
          </div>
          <MotionStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) => (
              <MotionStaggerItem key={item.id}>
                <ContentCard {...item} />
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      <section className="section-y overflow-hidden">
        <div className="container-verlin">
          <SectionHeader
            eyebrow="Testimonials"
            title="What learners are saying"
            subtitle="Students, engineers, and product managers who started with clarity."
            className="mb-14"
          />
          <TestimonialCarousel testimonials={testimonials} />
        </div>
      </section>

      <Newsletter
        title={site.newsletter.title}
        description={site.newsletter.description}
        cta={site.newsletter.cta}
      />
    </>
  );
}