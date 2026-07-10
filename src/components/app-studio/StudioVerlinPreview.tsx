"use client";

/**
 * Full product screen using Verlin Labs UI primitives (Button, Card, Badge, Input).
 * Used in the side panel and in the full-screen viewer.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { GenericAppContent } from "@/lib/app-builder/types";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone, Star } from "lucide-react";
import { useState } from "react";

export function StudioVerlinPreview({
  content,
  fullScreen = false,
  className,
}: {
  content: GenericAppContent;
  /** Stretch to fill the viewport / parent without rounded mini-chrome */
  fullScreen?: boolean;
  className?: string;
}) {
  const [pageKey, setPageKey] = useState("home");
  const page =
    content.pages.find((p) => p.path === pageKey) ||
    content.pages.find((p) => p.path === "home") ||
    content.pages[0];

  const isHome = pageKey === "home" || page?.path === "home";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-background text-foreground",
        fullScreen
          ? "h-full min-h-0 w-full"
          : "h-full min-h-[420px] rounded-xl border border-border",
        className
      )}
    >
      {/* App top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={() => setPageKey("home")}
            className="text-left"
          >
            <p className="text-lg font-semibold tracking-tight md:text-xl">
              {content.brandName}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">{content.tagline}</p>
          </button>
          <nav className="flex flex-wrap items-center gap-1" aria-label="App navigation">
            {content.pages.map((p) => (
              <button
                key={p.path}
                type="button"
                onClick={() => setPageKey(p.path)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
                  pageKey === p.path
                    ? "bg-accent-teal/10 text-accent-teal"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {p.title}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {!fullScreen && (
              <Badge className="hidden bg-accent-teal/15 text-accent-teal sm:inline-flex">
                Preview
              </Badge>
            )}
            <Button
              type="button"
              variant="cta"
              size="sm"
              onClick={() => {
                const target =
                  content.pages.find((p) => /book|app|schedule|start|apply/i.test(p.path))?.path ||
                  content.pages[1]?.path ||
                  "home";
                setPageKey(target);
              }}
            >
              {content.ctaLabel || "Get started"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* Hero (home only) */}
        {isHome && (
          <section className="border-b border-border bg-gradient-to-br from-[var(--navy,#0f2744)] via-slate-900 to-teal-900 px-4 py-12 text-white md:px-6 md:py-16">
            <div className="mx-auto max-w-5xl">
              <p className="text-sm font-medium text-teal-200/90">
                {content.trustBadges?.[0] || "Built with Verlin Labs"}
              </p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
                {content.heroHeadline || content.brandName}
              </h1>
              <p className="mt-4 max-w-xl text-base text-slate-200 md:text-lg">
                {content.heroSubheadline || content.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="cta"
                  size="lg"
                  onClick={() =>
                    setPageKey(
                      content.pages.find((p) => p.path !== "home")?.path || "home"
                    )
                  }
                >
                  {content.ctaLabel || "Get started"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {content.secondaryCtaLabel && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    onClick={() =>
                      setPageKey(
                        content.pages.find((p) => p.path === "about")?.path ||
                          content.pages[1]?.path ||
                          "home"
                      )
                    }
                  >
                    {content.secondaryCtaLabel}
                  </Button>
                )}
              </div>
              {content.trustBadges?.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {content.trustBadges.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-teal-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-6 md:py-10">
          {!isHome && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
                {page?.headline || page?.title}
              </h1>
            </div>
          )}

          {/* Features grid on home */}
          {isHome && content.features.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">What you can do</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {content.features.map((f) => (
                  <Card key={f.id} className="p-5">
                    <p className="text-2xl">{f.icon || "✨"}</p>
                    <p className="mt-2 font-semibold">{f.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Page body */}
          {page?.bodyHtml && (
            <section>
              <div
                className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-accent-teal"
                dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
              />
            </section>
          )}

          {/* Contact form on contact-like pages */}
          {page && /contact|book|apply|signup|register/i.test(`${page.path} ${page.title}`) && (
            <Card className="max-w-lg space-y-4 p-6">
              <p className="font-semibold">{page.ctaLabel || "Send a message"}</p>
              <Input placeholder="Your name" />
              <Input type="email" placeholder="Email" />
              <Input placeholder="Phone (optional)" />
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="How can we help?"
              />
              <Button type="button" variant="cta">
                {page.ctaLabel || "Submit"}
              </Button>
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
                {content.contactEmail && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {content.contactEmail}
                  </span>
                )}
                {content.contactPhone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {content.contactPhone}
                  </span>
                )}
                {content.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {content.address}
                  </span>
                )}
              </div>
            </Card>
          )}

          {page?.ctaLabel && !/contact|book|apply/i.test(page.path) && !isHome && (
            <Button type="button" variant="cta">
              {page.ctaLabel}
            </Button>
          )}

          {/* FAQ */}
          {(isHome || pageKey === "faq") && content.faqs.length > 0 && (
            <section className="space-y-3 border-t border-border pt-8">
              <h2 className="text-xl font-semibold">FAQ</h2>
              <div className="space-y-2">
                {content.faqs.map((f) => (
                  <Card key={f.question} className="p-4">
                    <p className="font-medium">{f.question}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Data entities as modules */}
          {isHome && content.customBlocks && content.customBlocks.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Core modules</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {content.customBlocks.map((b) => (
                  <Badge key={b.title} className="bg-muted text-foreground">
                    {b.title}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Social proof strip */}
          {isHome && (
            <section className="rounded-2xl border border-border bg-muted/30 p-6">
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Built for {(content as { city?: string }).city || "your customers"} with a clear
                workflow — research-backed pages from App Studio.
              </p>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
        <p>{content.footerNote}</p>
        <p className="mt-1 opacity-70">
          {content.contactEmail}
          {content.contactPhone ? ` · ${content.contactPhone}` : ""}
        </p>
      </footer>
    </div>
  );
}
