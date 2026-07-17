import dynamic from "next/dynamic";
import { AudienceCard } from "@/components/sections/AudienceCard";
import { ContentCard } from "@/components/sections/ContentCard";
import { HeroSection } from "@/components/sections/HeroSection";
import { LearningSplit } from "@/components/sections/LearningSplit";
import { StatsBar } from "@/components/sections/StatsBar";
import { TrustSignals } from "@/components/sections/TrustSignals";
import { WhatWeCover } from "@/components/sections/WhatWeCover";

const HowItWorks = dynamic(() =>
  import("@/components/sections/HowItWorks").then((m) => m.HowItWorks)
);
const HomeFreeSessionForm = dynamic(() =>
  import("@/components/sections/HomeFreeSessionForm").then((m) => m.HomeFreeSessionForm)
);
const TestimonialCarousel = dynamic(() =>
  import("@/components/sections/TestimonialCarousel").then((m) => m.TestimonialCarousel)
);
const Newsletter = dynamic(() =>
  import("@/components/sections/Newsletter").then((m) => m.Newsletter)
);
const HomeFaq = dynamic(() =>
  import("@/components/sections/HomeFaq").then((m) => m.HomeFaq)
);
import { SectionShell } from "@/components/layout/SectionShell";
import {
  getSiteConfig,
  getAudiences,
  getFeaturedLibraryItems,
  getTestimonials,
} from "@/lib/content";
import { getHomeContentData } from "@/lib/cms/home-content-data";
import { MotionStagger, MotionStaggerItem } from "@/components/ui/MotionReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import Link from "next/link";
import { SeoRichTextSection } from "@/components/seo/SeoRichTextSection";
import { HOME_SEO_BLOCK } from "@/lib/seo-content";

export function MarketingHome() {
  const site = getSiteConfig();
  const audiences = getAudiences();
  const featured = getFeaturedLibraryItems();
  const testimonials = getTestimonials();
  const home = getHomeContentData();

  return (
    <>
      <HeroSection hero={home.hero} />
      <WhatWeCover topics={home.whatWeCover} />
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
                href={
                  a.slug === "students"
                    ? "/ai-for-students"
                    : a.slug === "engineers"
                      ? "/ai-for-engineers"
                      : a.slug === "professionals"
                        ? "/ai-for-pms"
                        : `/courses/${a.slug}`
                }
              />
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </SectionShell>

      <SectionShell id="approach" tinted>
        <div className="space-y-12 md:space-y-16">
          <LearningSplit
            title="Learn with mental models, not memorization"
            description="Frameworks that stick — visual maps, live explanation, and pacing matched to you."
            image={home.learningIllustrations.mentalModels.src}
            imageAlt={home.learningIllustrations.mentalModels.alt}
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
            image={home.learningIllustrations.handsOn.src}
            imageAlt={home.learningIllustrations.handsOn.alt}
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

      <HowItWorks
        steps={home.howItWorks}
        illustration={home.howItWorksIllustration}
      />

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

      <TrustSignals compact />

      <HomeFaq items={home.homeFaqs} />

      <SectionShell id="testimonials" tinted>
        <SectionHeader
          eyebrow="Testimonials"
          title="What learners are saying"
          subtitle="Students, engineers, and PMs who started with clarity."
          className="mb-10 md:mb-16"
        />
        <TestimonialCarousel testimonials={testimonials} />
        <p className="mt-8 text-center">
          <a
            href="/testimonials"
            className="text-sm font-medium text-teal hover:underline"
          >
            Read all testimonials →
          </a>
        </p>
      </SectionShell>

      <Newsletter
        title={site.newsletter.title}
        description={site.newsletter.description}
        cta={site.newsletter.cta}
        linkToPage
      />

      <SeoRichTextSection block={HOME_SEO_BLOCK} />
    </>
  );
}