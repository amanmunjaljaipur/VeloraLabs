"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ContentCard } from "@/components/sections/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Input } from "@/components/ui/Input";
import type { LibraryItem } from "@/lib/content";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

const levelOptions = [
  { value: "", label: "All" },
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

const audienceOptions = [
  { value: "", label: "All" },
  { value: "students", label: "Students" },
  { value: "engineers", label: "Engineers" },
  { value: "professionals", label: "Product Managers" },
];

const formatOptions = [
  { value: "", label: "All" },
  { value: "Article", label: "Article" },
  { value: "Guide", label: "Guide" },
  { value: "Workshop", label: "Workshop" },
  { value: "Video", label: "Video" },
];

export function LibraryClient({ items }: { items: LibraryItem[] }) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [audience, setAudience] = useState("");
  const [type, setType] = useState("");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchesLevel = !level || item.level === level;
      const matchesAudience = !audience || item.audience === audience || item.audience === "all";
      const matchesType = !type || item.type === type;
      return matchesSearch && matchesLevel && matchesAudience && matchesType;
    });
  }, [items, search, level, audience, type]);

  const clearFilters = () => {
    setSearch("");
    setLevel("");
    setAudience("");
    setType("");
  };

  return (
    <>
      <PageHeader
        title="Content Library"
        subtitle="Articles, guides, and workshops — organized for clarity."
      />

      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="relative mb-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Search content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Search library content"
            />
          </div>

          <div className="mb-10 space-y-6 rounded-2xl border border-border bg-card p-5 md:p-6">
            <FilterTabs label="Level" options={levelOptions} value={level} onChange={setLevel} />
            <FilterTabs
              label="Audience"
              options={audienceOptions}
              value={audience}
              onChange={setAudience}
            />
            <FilterTabs label="Format" options={formatOptions} value={type} onChange={setType} />
          </div>

          <p className="mb-6 text-sm text-text-secondary">
            {filtered.length} resource{filtered.length === 1 ? "" : "s"} found
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              title="No content matches your filters"
              description="Try adjusting your search or filter criteria."
              cta={{ label: "Clear filters", href: "/library" }}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => (
                <ContentCard key={item.id} {...item} />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-medium text-teal hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </section>
    </>
  );
}