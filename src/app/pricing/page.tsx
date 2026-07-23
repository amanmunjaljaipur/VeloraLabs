import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { ConversionJourney } from "@/components/sections/ConversionJourney";
import { staticPageMetadata } from "@/lib/page-metadata";
import { getIntroPricing } from "@/lib/pricing";
import { getAllCourseTracks } from "@/lib/content";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = staticPageMetadata("pricing", "/pricing");

const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Pricing" }];

interface TierFeature {
  text: string;
}

function Feature({ text }: TierFeature) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-text-secondary">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
      <span>{text}</span>
    </li>
  );
}

export default function PricingPage() {
  const tracks = getAllCourseTracks();
  const studentTrack = tracks.find((t) => t.slug === "students")!;
  const engineerTrack = tracks.find((t) => t.slug === "engineers")!;
  const professionalTrack = tracks.find((t) => t.slug === "professionals")!;

  const studentPricing = getIntroPricing(studentTrack.course.price);
  const engineerPricing = getIntroPricing(engineerTrack.course.price);
  const professionalPricing = getIntroPricing(professionalTrack.course.price);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/pricing" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        subtitle="Start free. Pick the track that fits where you are - school, college, or work. No hidden fees, no recurring subscription traps."
        compact
        align="center"
      />

      <section className="section-y pt-0">
        <div className="container-verlin">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Free trial tier */}
            <Card className="flex flex-col p-6 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Trial
              </p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">Free Session</h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold tabular-nums tracking-tight text-teal">₹0</span>
              </p>
              <p className="mt-1 text-xs text-text-secondary">No card required</p>
              <ul className="mt-6 flex-1 space-y-3">
                <Feature text="Live 2-hour session with a real instructor" />
                <Feature text="Hands-on mental-model walkthrough" />
                <Feature text="Personalized track recommendation" />
                <Feature text="No commitment - decide after the session" />
              </ul>
              <ButtonLink href="/free-session" size="md" className="mt-6 w-full" variant="secondary">
                Book Free Session
              </ButtonLink>
            </Card>

            {/* Student tier */}
            <Card variant="glass" className="flex flex-col p-6 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal">Student</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">School Students</h3>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-4xl font-bold tabular-nums tracking-tight text-teal">
                  {studentPricing.current}
                </span>
                <span className="text-sm font-medium text-text-muted line-through decoration-2">
                  {studentPricing.original}
                </span>
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Introductory offer · You save {studentPricing.savings}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                <Feature text={`${studentTrack.course.duration} live program`} />
                <Feature text="Classes 6-12, taught with age-appropriate analogies" />
                <Feature text="Safe, supervised AI tool use" />
                <Feature text="Hands-on mini projects + showcase" />
              </ul>
              <ButtonLink href="/courses/students" size="md" className="mt-6 w-full" variant="cta">
                View student track
              </ButtonLink>
            </Card>

            {/* Professional tier - covers Engineers + PMs */}
            <Card variant="glass" className="flex flex-col border-2 border-accent-teal/40 p-6 shadow-glow-teal md:p-7">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal">Professional</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-cta-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                  Popular
                </span>
              </div>
              <h3 className="mt-2 text-xl font-semibold text-foreground">Engineers &amp; PMs</h3>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-4xl font-bold tabular-nums tracking-tight text-teal">
                  {engineerPricing.current}
                </span>
                <span className="text-sm text-text-secondary">onward</span>
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Two tracks - pick the one that fits your role
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                <li className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-foreground">College Engineers</span>
                  <span className="shrink-0 font-semibold text-teal">{engineerPricing.current}</span>
                </li>
                <li className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-foreground">Product Managers</span>
                  <span className="shrink-0 font-semibold text-teal">{professionalPricing.current}</span>
                </li>
                <Feature text="RAG, embeddings, evals, and portfolio projects (Engineers)" />
                <Feature text="AI-powered discovery, PRDs, and MVP shipping (PMs)" />
                <Feature text="Live sessions + demo day capstone" />
              </ul>
              <div className="mt-6 flex flex-col gap-2">
                <ButtonLink href="/courses/engineers" size="md" variant="cta" className="w-full">
                  View Engineer track
                </ButtonLink>
                <ButtonLink href="/courses/professionals" size="md" variant="secondary" className="w-full">
                  View PM track
                </ButtonLink>
              </div>
            </Card>

            {/* Enterprise tier */}
            <Card className="flex flex-col p-6 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Enterprise
              </p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">Corporate Workshops</h3>
              <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">Custom</p>
              <p className="mt-1 text-xs text-text-secondary">Volume pricing for teams</p>
              <ul className="mt-6 flex-1 space-y-3">
                <Feature text="Tailored curriculum for your team's tools and workflows" />
                <Feature text="On-site or remote delivery" />
                <Feature text="Dedicated success manager" />
                <Feature text="Manager follow-up resources and reporting" />
              </ul>
              <ButtonLink href="/corporate" size="md" className="mt-6 w-full" variant="secondary">
                Contact sales
              </ButtonLink>
            </Card>
          </div>

          <p className="mt-8 text-center text-xs text-text-secondary">
            All program prices are one-time - no recurring subscription. Introductory pricing shown
            above is available for a limited time.{" "}
            <Link href="/faq" className="font-medium text-teal hover:underline">
              See pricing FAQ
            </Link>
          </p>
        </div>
      </section>

      <ConversionJourney />

      <section className="section-y bg-muted/30">
        <div className="container-verlin">
          <SectionHeader
            eyebrow="Not sure which plan?"
            title="Start with the free session"
            subtitle="Every learner starts here - we help you pick the right paid track after you have met your instructor."
            className="mb-8"
          />
          <div className="text-center">
            <ButtonLink href="/free-session" size="lg" variant="cta" className="shadow-glow-amber">
              Book Free 2-Hour Session
            </ButtonLink>
          </div>
        </div>
      </section>

      <SiteExploreLinks section="programs" title="Related programs" limit={4} />
    </>
  );
}
