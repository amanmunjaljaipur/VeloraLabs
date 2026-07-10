"use client";

/**
 * Draft preview using the same Verlin UI primitives as live apps
 * (Button, Card, Badge) — no auth required.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { GenericAppContent } from "@/lib/app-builder/types";
import { useState } from "react";

export function StudioVerlinPreview({ content }: { content: GenericAppContent }) {
  const [pageKey, setPageKey] = useState("home");
  const page =
    content.pages.find((p) => p.path === pageKey) ||
    content.pages.find((p) => p.path === "home") ||
    content.pages[0];

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground">
      <header className="border-b border-border bg-card/95 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-semibold tracking-tight">{content.brandName}</p>
            <p className="text-xs text-muted-foreground">{content.tagline}</p>
          </div>
          <Badge className="bg-accent-teal/15 text-accent-teal">Verlin UI preview</Badge>
        </div>
        <nav className="mt-3 flex flex-wrap gap-1">
          {content.pages.map((p) => (
            <button
              key={p.path}
              type="button"
              onClick={() => setPageKey(p.path)}
              className={`rounded-lg px-2.5 py-1.5 text-sm font-medium ${
                pageKey === p.path
                  ? "bg-accent-teal/10 text-accent-teal"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.title}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {page?.headline || page?.title || content.heroHeadline}
            </h1>
            {pageKey === "home" && (
              <p className="mt-2 text-muted-foreground">{content.heroSubheadline}</p>
            )}
          </div>

          {pageKey === "home" && content.features.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {content.features.slice(0, 4).map((f) => (
                <Card key={f.id} className="p-4">
                  <p className="font-semibold">
                    {f.icon} {f.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                </Card>
              ))}
            </div>
          )}

          {page?.bodyHtml && (
            <div
              className="prose prose-sm max-w-none dark:prose-invert text-foreground"
              dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
            />
          )}

          {page?.ctaLabel && (
            <Button variant="cta" type="button">
              {page.ctaLabel}
            </Button>
          )}

          {pageKey === "home" && content.faqs.length > 0 && (
            <section className="space-y-2 border-t border-border pt-4">
              <h2 className="font-semibold">FAQ</h2>
              {content.faqs.slice(0, 3).map((f) => (
                <Card key={f.question} className="p-3">
                  <p className="text-sm font-medium">{f.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{f.answer}</p>
                </Card>
              ))}
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-border px-4 py-2 text-center text-[11px] text-muted-foreground">
        {content.footerNote}
      </footer>
    </div>
  );
}
