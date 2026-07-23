import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { staticPageMetadata } from "@/lib/page-metadata";
import { Code2, Download, FileJson, Users } from "lucide-react";
import Link from "next/link";

export const metadata = staticPageMetadata("docs", "/docs");

const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Docs" }];

const cards = [
  {
    icon: Code2,
    title: "API Reference",
    description: "The public, read-only mental-models API - endpoints, params, and response shapes.",
    href: "/docs/api",
    cta: "Read the API docs",
  },
  {
    icon: FileJson,
    title: "Sample Dataset",
    description: "A live JSON export of our full mental-model library - use it to prototype an integration.",
    href: "/api/public/mental-models",
    cta: "View sample data",
  },
  {
    icon: Users,
    title: "Enterprise Onboarding",
    description: "How corporate and team accounts get set up, from first call to first workshop.",
    href: "/corporate",
    cta: "See enterprise plans",
  },
  {
    icon: Download,
    title: "Downloadable Resources",
    description: "Worksheets, cheat sheets, and glossaries you can hand to your team directly.",
    href: "/resources",
    cta: "Browse resources",
  },
];

export default function DocsPage() {
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/docs" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Documentation"
        title="Build with Verlin Labs"
        subtitle="Everything a developer or enterprise team needs to integrate our content, or onboard a team."
        compact
      />

      <section className="section-y pt-0">
        <div className="container-verlin">
          <div className="grid gap-6 sm:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} href={card.href} className="group block h-full">
                  <Card hover className="flex h-full flex-col p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-teal/10 text-teal">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-foreground group-hover:text-teal">
                      {card.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                      {card.description}
                    </p>
                    <span className="mt-4 text-sm font-medium text-teal">{card.cta} →</span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-y bg-muted/30">
        <div className="container-verlin">
          <h2 className="section-title text-center">Getting started, step by step</h2>
          <div className="mx-auto mt-10 max-w-2xl space-y-6">
            {[
              {
                step: "1",
                title: "Explore the API for free",
                body: "No API key needed. Call /api/public/mental-models directly - see the API Reference for the full response shape.",
              },
              {
                step: "2",
                title: "Try the live demo",
                body: "See the same data rendered as an interactive tool at /demo - a reference implementation you can copy the pattern from.",
              },
              {
                step: "3",
                title: "Talk to us about deeper integration",
                body: "Need write access, webhooks, or a custom data feed for your LMS or internal tools? Corporate plans include a dedicated integration contact.",
              },
              {
                step: "4",
                title: "Onboard your team",
                body: "Enterprise accounts get a tailored curriculum, a kickoff call, and a named success manager - see Corporate Workshops for details.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
