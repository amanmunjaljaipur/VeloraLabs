import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AudienceCard } from "@/components/sections/AudienceCard";
import { ContentCard } from "@/components/sections/ContentCard";
import { TestimonialCard } from "@/components/sections/TestimonialCard";
import { Newsletter } from "@/components/sections/Newsletter";
import {
  getSiteConfig,
  getAudiences,
  getFreeSession,
  getFeaturedLibraryItems,
  getTestimonials,
} from "@/lib/content";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  const site = getSiteConfig();
  const audiences = getAudiences();
  const freeSession = getFreeSession();
  const featured = getFeaturedLibraryItems();
  const testimonials = getTestimonials();

  return (
    <>
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-teal/5 via-transparent to-accent-teal/5" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-text-secondary">
              <Sparkles className="h-4 w-4 text-accent-teal" />
              Clarity-first learning for the AI age
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-foreground">
              {site.tagline}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl">
              {site.description}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/free-session">
                <Button size="lg">Book Free 2-Hour Session</Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="secondary">
                  Explore Programs <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-4">Who is this for?</h2>
          <p className="text-center text-text-secondary mb-12 max-w-2xl mx-auto">
            Tailored learning paths for every stage of your journey.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {audiences.map((a) => (
              <AudienceCard
                key={a.slug}
                title={a.title}
                description={a.heroSubtitle}
                icon={a.icon}
                href={`/for/${a.slug}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-4">
            What You&apos;ll Learn in the Free Session
          </h2>
          <p className="text-center text-text-secondary mb-12 max-w-2xl mx-auto">
            A focused 2-hour experience — no fluff, no sales pitch.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {freeSession.benefits.map((b) => (
              <Card key={b.title} hover>
                <h3 className="font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{b.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
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

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">
            What learners are saying
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} {...t} />
            ))}
          </div>
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