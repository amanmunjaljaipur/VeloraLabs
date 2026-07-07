"use client";

import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SiteFaqCategory } from "@/lib/cms/faq-content-types";
import {
  BookOpen,
  Building2,
  CalendarClock,
  CircleHelp,
  Globe,
  GraduationCap,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  general: CircleHelp,
  "free-session": CalendarClock,
  programs: GraduationCap,
  learning: BookOpen,
  teams: Building2,
  logistics: Globe,
};

function matchesSearch(
  query: string,
  category: SiteFaqCategory,
  item: SiteFaqCategory["items"][number]
): boolean {
  const haystack = [
    category.title,
    category.description,
    item.question,
    item.answer,
    ...(item.bullets ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function filterCategories(query: string, categories: SiteFaqCategory[]): SiteFaqCategory[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return categories;

  return categories.map((category) => ({
    ...category,
    items: category.items.filter((item) => matchesSearch(normalized, category, item)),
  })).filter((category) => category.items.length > 0);
}

interface FaqClientProps {
  categories: SiteFaqCategory[];
  totalCount: number;
}

export function FaqClient({ categories, totalCount }: FaqClientProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => filterCategories(search, categories), [search, categories]);
  const resultCount = filtered.reduce((sum, cat) => sum + cat.items.length, 0);
  const isSearching = search.trim().length > 0;

  return (
    <>
      <section className="border-b border-border bg-muted/20 py-10 md:py-12">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10"
              aria-label="Search FAQ"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-text-secondary hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-3 text-center text-sm text-text-secondary">
            {isSearching ? (
              <>
                {resultCount} result{resultCount === 1 ? "" : "s"} found
                {resultCount === 0 && " — try different keywords"}
              </>
            ) : (
              <>Search across {totalCount} answers in {categories.length} categories</>
            )}
          </p>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
              <p className="font-medium text-foreground">No matching questions</p>
              <p className="mt-2 text-sm text-text-secondary">
                Try broader terms like &quot;free&quot;, &quot;track&quot;, or &quot;beginner&quot;.
              </p>
              <Button variant="secondary" className="mt-6" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </div>
          ) : (
            <div className="space-y-12">
              {filtered.map((category) => {
                const Icon = CATEGORY_ICONS[category.id] ?? CircleHelp;
                return (
                  <div key={category.id} id={category.id}>
                    <div className="mb-5 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{category.title}</h2>
                        <p className="mt-1 text-sm text-text-secondary">{category.description}</p>
                      </div>
                    </div>
                    <Accordion
                      items={category.items}
                      defaultOpenIndex={isSearching ? 0 : null}
                      allowMultiple={isSearching}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-gradient-to-br from-navy/5 via-background to-accent-teal/5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center md:px-8">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            Didn&apos;t find what you were looking for?
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Book a free session to experience how we teach, or send us a message — we typically
            respond within 24–48 hours.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/free-session">
              <Button variant="cta" size="lg" className="w-full sm:w-auto">
                Book Free Session
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}