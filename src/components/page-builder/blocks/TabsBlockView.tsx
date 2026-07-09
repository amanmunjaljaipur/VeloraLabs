"use client";

import type { TabsBlockProps } from "@/lib/cms/page-builder-types";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function TabsBlockView({ props }: { props: TabsBlockProps }) {
  const [active, setActive] = useState(0);
  const items = props.items ?? [];
  if (!items.length) return null;

  const safeIndex = Math.min(active, items.length - 1);
  const panel = items[safeIndex];

  return (
    <section className="container-verlin py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        {props.title ? (
          <h2 className="mb-6 text-2xl font-semibold tracking-tight md:text-3xl">{props.title}</h2>
        ) : null}
        <div role="tablist" aria-label={props.title || "Tabs"} className="flex flex-wrap gap-2 border-b border-border pb-2">
          {items.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              type="button"
              role="tab"
              aria-selected={safeIndex === index}
              id={`tab-${index}`}
              onClick={() => setActive(index)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                safeIndex === index
                  ? "bg-accent-teal text-white"
                  : "bg-muted/40 text-text-secondary hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          aria-labelledby={`tab-${safeIndex}`}
          className="cms-rich-prose mt-6 rounded-xl border border-border bg-card p-5"
          dangerouslySetInnerHTML={{ __html: panel?.html ?? "" }}
        />
      </div>
    </section>
  );
}
