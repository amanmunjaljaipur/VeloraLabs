import dynamic from "next/dynamic";
import { AudienceCard } from "@/components/sections/AudienceCard";
import { ContentCard } from "@/components/sections/ContentCard";
import { CinematicCta } from "@/components/sections/CinematicCta";
import { HeroSection } from "@/components/sections/HeroSection";
import { LearningSplit } from "@/components/sections/LearningSplit";
import { StatsBar } from "@/components/sections/StatsBar";
import { TrustSignals } from "@/components/sections/TrustSignals";
import { WhatWeCover } from "@/components/sections/WhatWeCover";
import { BRAND_MEDIA } from "@/lib/brand-media";

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
        <div className="stack-header">
          <SectionHeader
            eyebrow="Learning paths"
            title="Who is this for?"
            subtitle="Three tracks, each built for a different starting point - students, engineers, and product managers."
          />
        </div>
        <MotionStagger className="grid-editorial md:grid-cols-3">
          {audiences.map((a) => (
            <MotionStaggerItem key={a.slug} className="h-full min-w-0">
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
        <div className="flex flex-col gap-16 md:gap-24">
          <LearningSplit
            title="We teach mental models, not tool lists"
            description="Most courses teach you what to click. We focus on why it works, so you can adapt when the tools change - and they will."
            image={home.learningIllustrations.mentalModels.src}
            imageAlt={home.learningIllustrations.mentalModels.alt}
            video={
              ("video" in home.learningIllustrations.mentalModels
                ? (home.learningIllustrations.mentalModels as { video?: string }).video
                : undefined) ?? BRAND_MEDIA.homeMentalModels.video
            }
            illustration
            items={[
              "Visual frameworks for complex AI concepts",
              "Live sessions - not passive video dumps",
              "Examples paced for your background",
            ]}
          />
          <LearningSplit
            title="Hands-on from day one"
            description="This is not magic - it is practice. Every program ends with something real: a project, portfolio piece, or working MVP."
            image={home.learningIllustrations.handsOn.src}
            imageAlt={home.learningIllustrations.handsOn.alt}
            video={
              ("video" in home.learningIllustrations.handsOn
                ? (home.learningIllustrations.handsOn as { video?: string }).video
                : undefined) ?? BRAND_MEDIA.homeHandsOn.video
            }
            illustration
            reverse
            items={[
              "Free 2-hour session with live exercises",
              "Capstone demo day on every track",
              "Real tools: ChatGPT, Claude, Lovable, Replit",
            ]}
          />
        </div>
      </SectionShell>

      <CinematicCta />

      <HomeFreeSessionForm />

      <HowItWorks
        steps={home.howItWorks}
        illustration={home.howItWorksIllustration}
      />

      <SectionShell id="library">
        <div className="stack-header">
          <SectionHeader
            eyebrow="Content library"
            title="Featured content"
            subtitle="Start with our most popular articles, guides, and workshops - then explore the full library."
          />
        </div>
        <MotionStagger className="grid-editorial sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <MotionStaggerItem key={item.id} className="h-full min-w-0">
              <ContentCard {...item} />
            </MotionStaggerItem>
          ))}
        </MotionStagger>
        <p className="mt-10 text-center">
          <Link href="/library" className="link-hover text-sm font-medium">
            View all content →
          </Link>
        </p>
      </SectionShell>

      <TrustSignals compact />

      <HomeFaq items={home.homeFaqs} />

      <SectionShell id="testimonials" tinted>
        <div className="stack-header">
          <SectionHeader
            eyebrow="Testimonials"
            title="What learners are saying"
            subtitle="Real feedback from learners who went from confused to confident."
          />
        </div>
        <TestimonialCarousel testimonials={testimonials} />
        <p className="mt-10 text-center">
          <Link
            href="/testimonials"
            className="link-hover text-sm font-medium"
          >
            Read all testimonials →
          </Link>
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