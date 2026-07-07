"use client";

import { ContentCard } from "@/components/sections/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Input } from "@/components/ui/Input";
import { MotionStagger, MotionStaggerItem } from "@/components/ui/MotionReveal";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import type { LibraryItem } from "@/lib/content";
import { useLoadMore } from "@/hooks/useLoadMore";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar, Search, User } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import Link from "next/link";
import { formatContentDateTime } from "@/lib/utils";
import { useMemo, useState } from "react";

const BLOG_PAGE_SIZE = 6;

const categoryOptions = [
  { value: "", label: "All topics" },
  { value: "LLMs", label: "LLMs" },
  { value: "Fundamentals", label: "Fundamentals" },
  { value: "Product", label: "Product" },
  { value: "Engineering", label: "Engineering" },
  { value: "RAG", label: "RAG" },
  { value: "Agents", label: "Agents" },
  { value: "Students", label: "Students" },
];

export function BlogClient({ posts }: { posts: LibraryItem[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) =>
        (b.updatedAt ?? b.publishedAt).localeCompare(a.updatedAt ?? a.publishedAt)
      ),
    [posts]
  );

  const filtered = useMemo(() => {
    return sorted.filter((post) => {
      const matchesSearch =
        !search ||
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.description.toLowerCase().includes(search.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = !category || post.tags.includes(category);
      return matchesSearch && matchesCategory;
    });
  }, [sorted, search, category]);

  const [featured, ...rest] = filtered;
  const { shown, hasMore, loadMore, remaining, total } = useLoadMore(rest, BLOG_PAGE_SIZE);
  const isIllustration = featured?.image.includes("thumb-") || featured?.image.includes("-illustration");

  return (
    <div className="section-y">
      <div className="container-verlin">
        <div className="mx-auto mb-10 max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search articles and topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>
        </div>

        <div className="mb-10 flex justify-center">
          <FilterTabs label="Topic" options={categoryOptions} value={category} onChange={setCategory} />
        </div>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                title="No posts found"
                description="Try a different search or category."
              />
            </motion.div>
          ) : (
            <motion.div
              key={`${search}-${category}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {featured && (
                <Link
                  href={`/library/${featured.slug}`}
                  className="group mb-12 block overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg md:mb-16"
                >
                  <div className="grid md:grid-cols-2">
                    <div
                      className={`relative aspect-[16/10] md:aspect-auto md:min-h-[320px] ${
                        isIllustration ? "bg-gradient-to-br from-accent-teal/5 via-background to-sky-50/40" : ""
                      }`}
                    >
                      <OptimizedImage
                        src={featured.image}
                        alt={featured.title}
                        fill
                        aboveFold
                        className={isIllustration ? "object-contain p-6" : "object-cover"}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <div className="flex flex-col justify-center p-6 md:p-10">
                      <p className="text-xs font-semibold uppercase tracking-widest text-teal">
                        Featured
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold text-foreground transition-colors group-hover:text-teal md:text-3xl">
                        {featured.title}
                      </h2>
                      <p className="mt-4 leading-relaxed text-text-secondary line-clamp-3">
                        {featured.description}
                      </p>
                      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {featured.updatedAt ? "Updated " : "Published "}
                          {formatContentDateTime(featured.updatedAt ?? featured.publishedAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          {featured.author}
                        </span>
                      </div>
                      <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-teal">
                        Read article <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <>
                  <p className="mb-6 text-sm text-text-secondary">
                    {rest.length} more article{rest.length === 1 ? "" : "s"}
                    {rest.length > BLOG_PAGE_SIZE && ` · Showing ${shown.length} of ${total}`}
                  </p>
                  <MotionStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((post) => (
                      <MotionStaggerItem key={post.id}>
                        <ContentCard
                          slug={post.slug}
                          title={post.title}
                          description={post.description}
                          duration={post.duration}
                          level={post.level}
                          type={post.type}
                          image={post.image}
                          publishedAt={post.publishedAt}
                          updatedAt={post.updatedAt}
                        />
                      </MotionStaggerItem>
                    ))}
                  </MotionStagger>
                  {hasMore && (
                    <LoadMoreButton
                      onClick={loadMore}
                      remaining={remaining}
                      total={total}
                      label="Show more articles"
                    />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}