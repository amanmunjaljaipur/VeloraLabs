import { Card } from "@/components/ui/Card";
import { getSitemapSectionLinks, type SitemapSectionId } from "@/lib/site-sitemap";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface SiteExploreLinksProps {
  section: SitemapSectionId;
  title?: string;
  subtitle?: string;
  excludeHref?: string;
  limit?: number;
}

const SECTION_DEFAULTS: Record<
  SitemapSectionId,
  { title: string; subtitle: string }
> = {
  programs: {
    title: "Explore programs",
    subtitle: "Free session, paid tracks, and team workshops.",
  },
  learn: {
    title: "Keep learning",
    subtitle: "Library, mental models, and curated resources.",
  },
  company: {
    title: "About Verlin Labs",
    subtitle: "Mission, answers, and ways to reach us.",
  },
  legal: {
    title: "Legal & policies",
    subtitle: "Terms, privacy, and refund information.",
  },
  account: {
    title: "Your account",
    subtitle: "Sign in or create a learner account.",
  },
};

export function SiteExploreLinks({
  section,
  title,
  subtitle,
  excludeHref,
  limit = 6,
}: SiteExploreLinksProps) {
  const defaults = SECTION_DEFAULTS[section];
  const links = getSitemapSectionLinks(section, excludeHref).slice(0, limit);

  if (links.length === 0) return null;

  return (
    <section className="border-t border-border bg-muted/20 py-12 md:py-16">
      <div className="container-verlin max-w-4xl">
        <h2 className="text-xl font-semibold text-foreground">
          {title ?? defaults.title}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {subtitle ?? defaults.subtitle}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="group block">
              <Card hover className="h-full p-4">
                <p className="font-medium text-foreground group-hover:text-teal">
                  {link.label}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                  {link.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal">
                  Visit page
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}