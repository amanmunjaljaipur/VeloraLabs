import { ContentCard } from "@/components/sections/ContentCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  getFeaturedLibraryItems,
  getMentalModels,
  getResourceDownloadsIndex,
} from "@/lib/content";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  ExternalLink,
  FileText,
  Layers,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const DOWNLOAD_ICONS: Record<string, LucideIcon> = {
  "free-session-workbook": FileText,
  "mental-models-cheat-sheet": Layers,
  "ai-glossary": BookMarked,
};

const RECOMMENDED_READING = [
  {
    title: "Thinking in Systems",
    author: "Donella Meadows",
    note: "Foundational systems thinking for any technical learner.",
  },
  {
    title: "The Art of Explanation",
    author: "Lee LeFever",
    note: "How to make complex ideas accessible to others.",
  },
  {
    title: "Anthropic Research",
    author: "anthropic.com/research",
    href: "https://www.anthropic.com/research",
    note: "Clear technical writing on AI safety and capabilities.",
  },
];

const TOOLS = [
  {
    name: "Claude / ChatGPT",
    detail: "For exploration, not answers - we teach you how to use them well.",
  },
  {
    name: "Notion",
    detail: "Organize learning notes and mental models in one place.",
  },
  {
    name: "Excalidraw",
    detail: "Sketch frameworks and system diagrams quickly.",
  },
];

export function ResourcesPageContent() {
  const downloads = getResourceDownloadsIndex();
  const featured = getFeaturedLibraryItems(3);
  const mentalModels = getMentalModels().slice(0, 3);

  return (
    <>
      <section id="downloads" className="section-y border-b border-border">
        <div className="container-verlin">
          <SectionHeader
            eyebrow="Downloads"
            title="Save, print, or reference"
            subtitle="Free workbooks and cheat sheets built for Verlin Labs sessions - open anytime."
            align="left"
            className="mb-10"
          />
          <div className="grid gap-5 md:grid-cols-3">
            {downloads.map((item) => {
              const Icon = DOWNLOAD_ICONS[item.slug] ?? FileText;
              return (
                <Link
                  key={item.slug}
                  href={`/resources/${item.slug}`}
                  className="group block h-full"
                >
                  <Card hover className="flex h-full flex-col p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal transition-colors group-hover:bg-accent-teal/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-teal">
                      {item.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                      {item.subtitle}
                    </p>
                    <p className="mt-4 text-sm font-medium text-teal">
                      {item.downloadLabel ?? "Open resource"} →
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border bg-muted/20">
        <div className="container-verlin">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              eyebrow="From the library"
              title="Featured reads"
              subtitle="Start with our most popular articles and guides - then explore the full library."
              align="left"
              className="mb-0"
            />
            <Link
              href="/library"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline"
            >
              View all library
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featured.map((item) => (
              <ContentCard
                key={item.id}
                slug={item.slug}
                title={item.title}
                description={item.description}
                duration={item.duration}
                level={item.level}
                type={item.type}
                image={item.image}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border">
        <div className="container-verlin">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              eyebrow="Frameworks"
              title="Core mental models"
              subtitle="The thinking tools behind everything we teach - each with a full guide."
              align="left"
              className="mb-0"
            />
            <Link
              href="/mental-models"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline"
            >
              All mental models
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {mentalModels.map((model) => (
              <Link
                key={model.slug}
                href={`/mental-models/${model.slug}`}
                className="group block h-full"
              >
                <Card hover className="flex h-full flex-col p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-teal">
                    {model.difficulty} · {model.readTime}
                  </p>
                  <h3 className="mt-2 font-semibold text-foreground group-hover:text-teal">
                    {model.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                    {model.shortDescription}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-b border-border bg-muted/20">
        <div className="container-verlin grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Reading list"
              title="Recommended reading"
              subtitle="Books and sources we point learners to again and again."
              align="left"
              className="mb-8"
            />
            <ul className="space-y-4">
              {RECOMMENDED_READING.map((item) => (
                <li key={item.title}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-accent-teal" />
                      <div>
                        {item.href ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-teal"
                          >
                            {item.title}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <p className="font-semibold text-foreground">
                            <em>{item.title}</em>
                            {item.author ? ` - ${item.author}` : ""}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-text-secondary">{item.note}</p>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeader
              eyebrow="Toolkit"
              title="Tools we use"
              subtitle="What we recommend in sessions - and how we think about using them."
              align="left"
              className="mb-8"
            />
            <ul className="space-y-4">
              {TOOLS.map((tool) => (
                <li key={tool.name}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-accent-teal" />
                      <div>
                        <p className="font-semibold text-foreground">{tool.name}</p>
                        <p className="mt-1 text-sm text-text-secondary">{tool.detail}</p>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-verlin">
          <Card className="border-accent-teal/20 bg-gradient-to-br from-accent-teal/5 to-transparent p-8 text-center md:p-12">
            <h2 className="text-2xl font-semibold text-foreground">Ready to go deeper?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
              Resources are a great start - live programs add structure, feedback, and cohort
              learning. Join our newsletter, book a free session, or explore paid tracks.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/free-session" variant="cta" size="lg">
                Book free session
              </ButtonLink>
              <ButtonLink href="/blog" variant="secondary" size="lg">
                Read the blog
              </ButtonLink>
              <ButtonLink href="/newsletter" variant="secondary" size="lg">
                Newsletter
              </ButtonLink>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}