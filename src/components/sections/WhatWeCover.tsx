"use client";

import { WHAT_WE_COVER } from "@/lib/home-content";

interface WhatWeCoverProps {
  topics?: string[];
}

export function WhatWeCover({ topics = WHAT_WE_COVER }: WhatWeCoverProps) {
  return (
    <section className="border-b border-border bg-[var(--canvas)]">
      <div className="container-verlin py-8 text-center md:py-10">
        <p className="section-eyebrow mx-auto mb-4">What we cover</p>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-2 md:gap-x-3">
          {topics.map((topic, i) => (
            <span key={topic} className="inline-flex items-center text-sm text-text-secondary md:text-[0.9375rem]">
              {i > 0 && (
                <span className="mr-2 text-border md:mr-3" aria-hidden>
                  ·
                </span>
              )}
              <span className="font-medium tracking-tight text-text-primary/90">
                {topic}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
