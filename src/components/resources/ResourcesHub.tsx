import { Card } from "@/components/ui/Card";
import {
  BookOpen,
  Brain,
  Download,
  FileText,
  Mail,
  Newspaper,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface HubCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const hubCards: HubCard[] = [
  {
    title: "Library",
    description: "Articles, guides, and workshops - organized for clarity.",
    href: "/library",
    icon: BookOpen,
    badge: "Deep dives",
  },
  {
    title: "Blog",
    description: "Shorter reads and updates from the Verlin Labs team.",
    href: "/blog",
    icon: Newspaper,
  },
  {
    title: "Mental Models",
    description: "Core frameworks we teach - explained without jargon.",
    href: "/mental-models",
    icon: Brain,
  },
  {
    title: "Downloads",
    description: "Workbooks, cheat sheets, and glossaries you can save or print.",
    href: "#downloads",
    icon: Download,
  },
  {
    title: "Newsletter",
    description: "Weekly clarity-first insights - no noise.",
    href: "/newsletter",
    icon: Mail,
  },
  {
    title: "Free session workbook",
    description: "Companion guide for your introductory session.",
    href: "/resources/free-session-workbook",
    icon: FileText,
  },
];

export function ResourcesHub() {
  return (
    <section className="border-b border-border bg-muted/30 py-12 md:py-14">
      <div className="container-verlin">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal">Quick links</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Jump to a section</h2>
          <p className="mt-2 text-text-secondary leading-relaxed">
            Pick a destination below - or scroll for downloads, featured reads, mental models,
            and more.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hubCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href} className="group block h-full">
                <Card hover className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal transition-colors group-hover:bg-accent-teal/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    {card.badge && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-text-secondary">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground group-hover:text-teal">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-text-secondary">
                    {card.description}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}