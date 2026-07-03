import { WHAT_WE_COVER } from "@/lib/home-content";

export function WhatWeCover() {
  return (
    <section className="border-b border-border bg-muted/20 py-6">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {WHAT_WE_COVER.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-text-secondary"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}