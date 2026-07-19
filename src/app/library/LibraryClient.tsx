"use client";

import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentCard } from "@/components/sections/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Input } from "@/components/ui/Input";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import type { LibraryItem } from "@/lib/content";
import { formatContentDateTime } from "@/lib/utils";
import { useLoadMore } from "@/hooks/useLoadMore";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const LIBRARY_PAGE_SIZE = 8;

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

export function LibraryClient({
  items,
  lastUpdated,
}: {
  items: LibraryItem[];
  lastUpdated?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [audience, setAudience] = useState("");
  const [type, setType] = useState("");

  const filtered = useMemo(() => {
    return [...items]
      .sort((a, b) =>
        (b.updatedAt ?? b.publishedAt).localeCompare(a.updatedAt ?? a.publishedAt)
      )
      .filter((item) => {
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

  const { shown, hasMore, loadMore, remaining, total } = useLoadMore(
    filtered,
    LIBRARY_PAGE_SIZE
  );

  const clearFilters = () => {
    setSearch("");
    setLevel("");
    setAudience("");
    setType("");
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Library" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} currentPath="/library" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow="Resources"
        title="Content Library"
        subtitle="Articles, guides, and workshops - organized for clarity."
        image="/images/brand-mental-models.jpg"
        imageAlt="Curated AI learning resources"
        video="/videos/library.mp4"
      />

      <section className="section-y">
        <div className="container-verlin">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              {items.length} resources across articles, guides, workshops, and videos.
              {lastUpdated && (
                <> · Last updated {formatContentDateTime(lastUpdated)}</>
              )}
            </p>
            <Link href="/blog" className="text-sm font-medium text-teal hover:underline">
              Browse blog →
            </Link>
          </div>

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

          <div className="card-verlin mb-10 space-y-6 p-5 md:p-6">
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
            {filtered.length > LIBRARY_PAGE_SIZE &&
              ` · Showing ${shown.length} of ${total}`}
          </p>

          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.hover, ease: EASE_OUT }}
              >
                <EmptyState
                  title="No content matches your filters"
                  description="Try adjusting your search or filter criteria."
                  cta={{ label: "Clear filters", href: "/library" }}
                />
              </motion.div>
            ) : (
              <motion.div
                key={`grid-${filtered.map((i) => i.id).join("-")}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.hover, ease: EASE_OUT }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {shown.map((item) => (
                  <ContentCard key={item.id} {...item} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {filtered.length > 0 && hasMore && (
            <LoadMoreButton
              onClick={loadMore}
              remaining={remaining}
              total={total}
              label="Show more resources"
            />
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