"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ContentCard } from "@/components/sections/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { LibraryItem } from "@/lib/content";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

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

  return (
    <>
      <PageHeader
        title="Content Library"
        subtitle="Articles, guides, and workshops — organized for clarity."
      />

      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <Input
                placeholder="Search content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Select
                options={[
                  { value: "", label: "All Levels" },
                  { value: "Beginner", label: "Beginner" },
                  { value: "Intermediate", label: "Intermediate" },
                  { value: "Advanced", label: "Advanced" },
                ]}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              />
              <Select
                options={[
                  { value: "", label: "All Audiences" },
                  { value: "students", label: "Students" },
                  { value: "engineers", label: "Engineers" },
                  { value: "professionals", label: "Professionals" },
                ]}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
              <Select
                options={[
                  { value: "", label: "All Types" },
                  { value: "Article", label: "Article" },
                  { value: "Video", label: "Video" },
                  { value: "Guide", label: "Guide" },
                  { value: "Workshop", label: "Workshop" },
                ]}
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </div>
          </div>

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
        </div>
      </section>
    </>
  );
}