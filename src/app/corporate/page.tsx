import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteExploreLinks } from "@/components/layout/SiteExploreLinks";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { staticPageMetadata } from "@/lib/page-metadata";
import {
  Building2,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ServiceJsonLd } from "@/components/seo/ServiceJsonLd";
import { SeoRichTextSection } from "@/components/seo/SeoRichTextSection";
import { CORPORATE_SEO_BLOCK } from "@/lib/seo-content";

export const metadata = staticPageMetadata("corporate", "/corporate");

const outcomes = [
  "Shared vocabulary for AI, agents, and automation - without buzzword bingo",
  "Hands-on exercises using tools your team already has access to",
  "Frameworks for evaluating AI features, risks, and build-vs-buy decisions",
  "Follow-up resource pack and optional office hours for managers",
];

const formats = [
  {
    title: "Half-day literacy workshop",
    duration: "3–4 hours",
    audience: "Cross-functional teams, 8–30 people",
    description:
      "Foundations, live demos, and facilitated discussion. Ideal for teams rolling out AI tools or reviewing vendor roadmaps.",
  },
  {
    title: "Multi-session enablement",
    duration: "2–4 weeks",
    audience: "Engineering, product, or leadership cohorts",
    description:
      "Deeper mental models, capstone-style exercises, and manager briefings. Custom pacing around your sprint calendar.",
  },
  {
    title: "Executive briefing",
    duration: "90 minutes",
    audience: "Leadership and decision-makers",
    description:
      "Strategy-level clarity on capabilities, limits, governance, and where to invest - no slide-deck theater.",
  },
];

export default function CorporatePage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Programs", href: "/programs" },
    { label: "Corporate Workshops" },
  ];

  return (
    <>
      <ServiceJsonLd />
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/corporate" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="For teams"
        title="Corporate & Team Workshops"
        subtitle="Clarity-first AI literacy for teams that need to move fast without guessing"
        image="/images/brand-hands-on.jpg"
        imageAlt="Hands-on team workshop - building practical AI fluency together"
        video="/videos/corporate.mp4"
        compact
      />

      <section className="section-y">
        <div className="container-verlin !max-w-5xl space-y-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg leading-relaxed text-text-secondary">
              We run live workshops for product, engineering, and business teams - the same
              clarity-first approach as our public programs, with examples and pacing tailored
              to your stack, industry, and goals.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact?topic=corporate">
                <Button size="lg">Request team info</Button>
              </Link>
              <Link href="/faq">
                <Button variant="secondary" size="lg">
                  Read FAQ
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { icon: Users, label: "Team-sized cohorts", detail: "8–30 learners per session" },
              { icon: Zap, label: "Practical focus", detail: "Live exercises, not lectures" },
              { icon: Building2, label: "Custom context", detail: "Your tools & use cases" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="p-6 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-semibold text-foreground">{item.label}</h2>
                  <p className="mt-1 text-sm text-text-secondary">{item.detail}</p>
                </Card>
              );
            })}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">What teams take away</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {outcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-text-secondary"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal" />
                  {outcome}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">Workshop formats</h2>
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {formats.map((format) => (
                <Card key={format.title} hover className="flex h-full flex-col p-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-accent-teal">
                    <Calendar className="h-4 w-4" />
                    {format.duration}
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">{format.title}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{format.audience}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">
                    {format.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-accent-teal/20 bg-accent-teal/5 p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-accent-teal">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider">
                    Next step
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  Tell us about your team
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Share team size, goals, timeline, and any tools you use. We&apos;ll reply with
                  format options, indicative pricing, and availability - usually within 2
                  business days.
                </p>
              </div>
              <Link href="/contact?topic=corporate" className="shrink-0">
                <Button size="lg">Contact for corporate program</Button>
              </Link>
            </div>
          </Card>

          <p className="text-center text-sm text-text-secondary">
            Cancellation and refund terms for corporate engagements are outlined in your proposal
            and our{" "}
            <Link href="/refund-policy" className="text-teal hover:underline">
              Refund &amp; Cancellation Policy
            </Link>
            .
          </p>
        </div>
      </section>
      <SiteExploreLinks section="programs" excludeHref="/corporate" />
      <SiteExploreLinks section="company" limit={3} />
      <SeoRichTextSection block={CORPORATE_SEO_BLOCK} />
    </>
  );
}