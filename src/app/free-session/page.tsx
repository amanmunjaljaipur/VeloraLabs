import { auth } from "@/auth";
import { FreeSessionBenefits } from "@/components/sections/FreeSessionBenefits";
import { FreeSessionHero } from "@/components/sections/FreeSessionHero";
import { SessionAgenda } from "@/components/sections/SessionAgenda";
import { AudienceCard } from "@/components/sections/AudienceCard";
import { TestimonialCard } from "@/components/sections/TestimonialCard";
import { SessionFaq } from "@/components/sections/SessionFaq";
import { FreeSessionBooking } from "./FreeSessionBooking";
import { isEnrolledLearner } from "@/lib/enrollment";
import { getAudiences, getFreeSession, getTestimonials } from "@/lib/content";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free 2-Hour Session",
  description: "Book your free introductory session and experience clarity-first learning.",
};

export default async function FreeSessionPage() {
  const session = await auth();
  if (
    session?.user &&
    isEnrolledLearner(session.user.email, session.user.role)
  ) {
    redirect("/");
  }
  const freeSession = getFreeSession();
  const audiences = getAudiences();
  const testimonials = getTestimonials();

  return (
    <>
      <FreeSessionHero headline={freeSession.headline} description={freeSession.description} />

      <div id="book">
        <FreeSessionBooking />
      </div>

      <FreeSessionBenefits benefits={freeSession.benefits} />

      <SessionAgenda agenda={freeSession.agenda} />

      <section className="py-16 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Sessions tailored to your background
            </h2>
            <p className="mt-3 text-text-secondary">
              Select your audience type when booking — content adapts for students, engineers, and professionals.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
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

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-semibold mb-10">What attendees say</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <TestimonialCard key={t.id} {...t} />
            ))}
          </div>
        </div>
      </section>

      <SessionFaq categories={freeSession.faqCategories} />
    </>
  );
}