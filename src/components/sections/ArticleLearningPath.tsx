import type { AudienceSlug, LibraryItem } from "@/lib/content";
import { ButtonLink } from "@/components/ui/ButtonLink";
import Link from "next/link";
import { ArrowRight, BookOpen, Wrench } from "lucide-react";

const AUDIENCE_PATHS: Record<
  Exclude<AudienceSlug, never> | "all",
  { landing: string; course: string; label: string; product: string; productLabel: string }
> = {
  all: {
    landing: "/programs",
    course: "/courses",
    label: "Explore Verlin Labs programs",
    product: "/products",
    productLabel: "Browse packaged offerings",
  },
  students: {
    landing: "/ai-for-students",
    course: "/courses/students",
    label: "AI training for school students",
    product: "/products#student-bundle",
    productLabel: "AI Explorers Starter Pack",
  },
  engineers: {
    landing: "/ai-for-engineers",
    course: "/courses/engineers",
    label: "AI training for college engineers",
    product: "/products#engineer-toolkit",
    productLabel: "AI Engineering Toolkit",
  },
  professionals: {
    landing: "/ai-for-pms",
    course: "/courses/professionals",
    label: "AI training for product managers",
    product: "/products#pm-toolkit",
    productLabel: "AI Product Manager Toolkit",
  },
};

const TOOL_LINKS = [
  { name: "Claude", href: "https://claude.ai", context: "AI-assisted drafting & analysis" },
  { name: "Replit", href: "https://replit.com", context: "Vibe-coding MVPs in PM & engineer tracks" },
  { name: "ChatGPT", href: "https://chat.openai.com", context: "Safe student introductions to AI assistants" },
] as const;

interface ArticleLearningPathProps {
  item: LibraryItem;
}

export function ArticleLearningPath({ item }: ArticleLearningPathProps) {
  const path = AUDIENCE_PATHS[item.audience];

  return (
    <section className="mt-10 rounded-2xl border border-accent-teal/25 bg-gradient-to-br from-accent-teal/5 to-transparent p-6">
      <div className="flex items-start gap-3">
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-accent-teal" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Verified learning path</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            This {item.type.toLowerCase()} connects to live Verlin Labs programs - not generic AI
            content. Apply these frameworks in a cohort with mentor feedback and a capstone demo.
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-sm text-text-secondary">
        <li>
          <Link href={path.landing} className="font-medium text-teal hover:underline">
            {path.label}
          </Link>
          {" · "}
          <Link href={path.course} className="font-medium text-teal hover:underline">
            Full course syllabus
          </Link>
          {" · "}
          <Link href={path.product} className="font-medium text-teal hover:underline">
            {path.productLabel}
          </Link>
        </li>
        {item.tags.some((t) => /product|pm|discovery/i.test(t)) && (
          <li>
            <Link
              href="/learn/llms-for-product-discovery"
              className="font-medium text-teal hover:underline"
            >
              Hub: How to use LLMs for product discovery
            </Link>
          </li>
        )}
        {item.tags.some((t) => /student|school|kids/i.test(t)) && (
          <li>
            <Link href="/learn/ai-for-school-students" className="font-medium text-teal hover:underline">
              Hub: AI learning roadmap for school students
            </Link>
          </li>
        )}
      </ul>

      <div className="mt-5 flex items-start gap-3 border-t border-border/80 pt-5">
        <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
        <p className="text-xs leading-relaxed text-text-secondary">
          Tools referenced in Verlin Labs programs:{" "}
          {TOOL_LINKS.map((tool, i) => (
            <span key={tool.name}>
              {i > 0 ? " · " : ""}
              <a
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-teal"
                title={tool.context}
              >
                {tool.name}
              </a>
            </span>
          ))}
          . Covered hands-on in live sessions - not affiliate links.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/free-session" variant="cta" size="md">
          Start with free session
        </ButtonLink>
        <ButtonLink href={path.course} variant="secondary" size="md">
          View program
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>
    </section>
  );
}