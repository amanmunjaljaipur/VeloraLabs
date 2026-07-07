import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/layout/PageHeader";
import { InstructorsSection } from "@/components/sections/InstructorsSection";
import type { SemanticHub } from "@/lib/semantic-hubs";
import Link from "next/link";

interface SemanticHubPageProps {
  hub: SemanticHub;
  breadcrumbs: { label: string; href?: string }[];
}

export function SemanticHubPage({ hub, breadcrumbs }: SemanticHubPageProps) {
  return (
    <>
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow={hub.eyebrow}
        title={hub.headline}
        subtitle={hub.subheadline}
        align="left"
      />

      <section className="section-y">
        <div className="container-verlin max-w-3xl">
          <p className="rounded-xl border border-accent-teal/20 bg-accent-teal/5 px-4 py-3 text-sm text-text-secondary">
            <span className="font-semibold text-foreground">Answers: </span>
            {hub.targetQuestion}
          </p>

          <div className="mt-10 space-y-10">
            {hub.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold text-foreground md:text-2xl">{section.title}</h2>
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)} className="mt-4 text-base leading-relaxed text-text-secondary">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/free-session" variant="cta" size="lg">
              {hub.freeSessionCta}
            </ButtonLink>
            <ButtonLink href={hub.landingHref} variant="secondary" size="lg">
              View landing page
            </ButtonLink>
            <ButtonLink href={hub.courseHref} variant="secondary" size="lg">
              Full course syllabus
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section-y border-t border-border bg-muted/20">
        <div className="container-verlin max-w-3xl">
          <h2 className="text-xl font-semibold text-foreground">Deep-dive library picks</h2>
          <ul className="mt-4 space-y-2">
            {hub.libraryLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="font-medium text-teal hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y">
        <div className="container-verlin max-w-3xl">
          <h2 className="text-xl font-semibold text-foreground">Common questions</h2>
          <div className="mt-6">
            <Accordion items={hub.faqs} defaultOpenIndex={0} />
          </div>
        </div>
      </section>

      <InstructorsSection compact />
    </>
  );
}