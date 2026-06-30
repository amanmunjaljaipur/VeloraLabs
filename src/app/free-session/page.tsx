import { PageHeader } from "@/components/layout/PageHeader";
import { AudienceCard } from "@/components/sections/AudienceCard";
import { TestimonialCard } from "@/components/sections/TestimonialCard";
import { Accordion } from "@/components/ui/Accordion";
import { Card } from "@/components/ui/Card";
import { BookingSection } from "./BookingSection";
import { getAudiences, getFreeSession, getTestimonials } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free 2-Hour Session",
  description: "Book your free introductory session and experience clarity-first learning.",
};

export default function FreeSessionPage() {
  const freeSession = getFreeSession();
  const audiences = getAudiences();
  const testimonials = getTestimonials();

  return (
    <>
      <PageHeader title={freeSession.headline} subtitle={freeSession.description} />

      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-semibold mb-8">Choose Your Audience</h2>
          <div className="grid gap-6 md:grid-cols-3 mb-16">
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

          <h2 className="text-2xl font-semibold mb-8">2-Hour Session Agenda</h2>
          <div className="space-y-4 mb-16">
            {freeSession.agenda.map((item, i) => (
              <Card key={item.title} className="flex gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal text-sm font-semibold">
                  {item.time}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>

          <h2 className="text-2xl font-semibold mb-8">Book Your Session</h2>
          <BookingSection />
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-semibold mb-8">What attendees say</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <TestimonialCard key={t.id} {...t} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="text-2xl font-semibold mb-8 text-center">Frequently Asked Questions</h2>
          <Accordion items={freeSession.faqs} />
        </div>
      </section>
    </>
  );
}