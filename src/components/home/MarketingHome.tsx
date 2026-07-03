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
import { SectionShell } from "@/components/layout/SectionShell";
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

      <SectionShell id="audiences" divider={false}>
        <SectionHeader
          eyebrow="Learning paths"
          title="Who is this for?"
          subtitle="Three tailored tracks — students, engineers, and product managers."
          className="mb-10 md:mb-16"
        />
        <MotionStagger className="grid gap-5 md:grid-cols-3 md:gap-6">
          {audiences.map((a) => (
            <MotionStaggerItem key={a.slug}>
              <AudienceCard
                title={a.title}
                description={a.heroSubtitle}
                icon={a.icon}
                image={a.image}
                href={`/courses/${a.slug}`}
              />
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </SectionShell>

      <SectionShell id="approach" tinted>
        <div className="space-y-16 md:space-y-28">
          <LearningSplit
            title="Learn with mental models, not memorization"
            description="Frameworks that stick — visual maps, live explanation, and pacing matched to you."
            image={LEARNING_ILLUSTRATIONS.mentalModels.src}
            imageAlt={LEARNING_ILLUSTRATIONS.mentalModels.alt}
            illustration
            items={[
              "Visual frameworks for complex AI concepts",
              "Live sessions — not passive video dumps",
              "Examples paced for your background",
            ]}
          />
          <LearningSplit
            title="Hands-on from day one"
            description="Every program ends with something real — a project, portfolio piece, or working MVP."
            image={LEARNING_ILLUSTRATIONS.handsOn.src}
            imageAlt={LEARNING_ILLUSTRATIONS.handsOn.alt}
            illustration
            reverse
            toolIcons
            items={[
              "Free 2-hour session with live exercises",
              "Capstone demo day on every track",
              "Real tools: ChatGPT, Claude, Lovable, Replit",
            ]}
          />
        </div>
      </SectionShell>

      <HomeFreeSessionForm />

      <HowItWorks />

      <SectionShell id="library">
        <div className="mb-10 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Content library"
            title="Featured content"
            subtitle="Start with our most popular articles, guides, and workshops — then explore the full library."
            align="left"
            className="mb-0"
          />
          <Link
            href="/library"
            className="link-hover shrink-0 text-sm font-medium text-teal sm:pb-1"
          >
            View all →
          </Link>
        </div>
        <MotionStagger className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {featured.map((item) => (
            <MotionStaggerItem key={item.id}>
              <ContentCard {...item} />
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </SectionShell>

      <SectionShell id="testimonials" tinted>
        <SectionHeader
          eyebrow="Testimonials"
          title="What learners are saying"
          subtitle="Students, engineers, and PMs who started with clarity."
          className="mb-10 md:mb-16"
        />
        <TestimonialCarousel testimonials={testimonials} />
      </SectionShell>

      <Newsletter
        title={site.newsletter.title}
        description={site.newsletter.description}
        cta={site.newsletter.cta}
        linkToPage
      />
    </>
  );
}