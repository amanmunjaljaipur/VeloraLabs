import { Card } from "@/components/ui/Card";
import { AudienceCard } from "@/components/sections/AudienceCard";
import { ContentCard } from "@/components/sections/ContentCard";
import { HeroSection } from "@/components/sections/HeroSection";
import { LearningSplit } from "@/components/sections/LearningSplit";
import { Newsletter } from "@/components/sections/Newsletter";
import { StatsBar } from "@/components/sections/StatsBar";
import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { TopicMarquee } from "@/components/sections/TopicMarquee";
import {
  getSiteConfig,
  getAudiences,
  getFreeSession,
  getFeaturedLibraryItems,
  getTestimonials,
} from "@/lib/content";
import Link from "next/link";
import { Brain, Layers, Zap } from "lucide-react";

export default function HomePage() {
  const site = getSiteConfig();
  const audiences = getAudiences();
  const freeSession = getFreeSession();
  const featured = getFeaturedLibraryItems();
  const testimonials = getTestimonials();

  return (
    <>
      <TopicMarquee />
      <HeroSection tagline={site.tagline} description={site.description} />
      <StatsBar />

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-4">Who is this for?</h2>
          <p className="text-center text-text-secondary mb-12 max-w-2xl mx-auto">
            Tailored learning paths for every stage of your journey — click to see the full course structure.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {audiences.map((a) => (
              <AudienceCard
                key={a.slug}
                title={a.title}
                description={a.heroSubtitle}
                icon={a.icon}
                image={a.image}
                href={`/for/${a.slug}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8 space-y-20">
          <LearningSplit
            title="Learn with mental models, not memorization"
            description="Inspired by the best in modern education — from DeepLearning.AI's intuitive courses to Coursera's structured paths — Verlin Labs teaches you frameworks that stick. Understand once, apply everywhere."
            image="/images/mental-models.jpg"
            imageAlt="Student studying with clarity"
            items={[
              "Visual frameworks for complex AI concepts",
              "Live sessions, not passive video dumps",
              "Audience-tailored pacing and examples",
            ]}
          />
          <LearningSplit
            title="Hands-on from day one"
            description="Like Dataquest and project-based bootcamps, every program ends with something you build — a mini project, portfolio piece, or working MVP you can show."
            image="/images/workshop.jpg"
            imageAlt="Live workshop session"
            reverse
            items={[
              "Free 2-hour session with live exercises",
              "Capstone demo days for every track",
              "Real tools: ChatGPT, Claude, Lovable, Replit",
            ]}
          />
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-4">
            What You&apos;ll Learn in the Free Session
          </h2>
          <p className="text-center text-text-secondary mb-12 max-w-2xl mx-auto">
            A focused 2-hour experience — no fluff, no sales pitch.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {freeSession.benefits.map((b, i) => {
              const icons = [Brain, Layers, Zap, Brain, Layers, Zap];
              const Icon = icons[i % icons.length];
              return (
                <Card key={b.title} hover className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-teal/5 rounded-bl-full" />
                  <Icon className="h-8 w-8 text-teal mb-4" />
                  <h3 className="font-semibold text-foreground">{b.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">{b.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold">Featured Content</h2>
              <p className="mt-2 text-text-secondary">Start exploring with our most popular resources.</p>
            </div>
            <Link href="/library" className="hidden sm:block text-teal hover:text-accent-teal font-medium text-sm">
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) => (
              <ContentCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-4">
            What learners are saying
          </h2>
          <p className="text-center text-text-secondary mb-12 max-w-xl mx-auto">
            Students, engineers, and product managers who started with clarity.
          </p>
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