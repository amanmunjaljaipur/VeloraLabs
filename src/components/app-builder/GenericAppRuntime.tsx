"use client";

import { AppBuilderFooter } from "@/components/app-builder/AppBuilderFooter";
import {
  logoWithTheme,
  resolveShopTheme,
  shopThemeCssVars,
  withAlpha,
} from "@/lib/app-builder/shop-theme";
import type { GenericAppContent } from "@/lib/app-builder/types";
import { cn } from "@/lib/utils";
import { Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

function pageFromPath(path: string | undefined, content: GenericAppContent) {
  const key = (path || "home").toLowerCase();
  return (
    content.pages.find((p) => p.path === key || p.id === key) ||
    content.pages.find((p) => p.path === "home") ||
    content.pages[0]
  );
}

export function GenericAppRuntime({
  content,
  pathSegments = [],
  embedded,
  activePage,
  onNavigate,
}: {
  content: GenericAppContent;
  pathSegments?: string[];
  embedded?: boolean;
  /** Controlled page from parent shell (StandaloneAppRuntime) */
  activePage?: string;
  onNavigate?: (page: string) => void;
}) {
  const initial = activePage || pathSegments[0] || "home";
  const [pageKey, setPageKey] = useState(initial);

  // Stay in sync with parent URL / logo clicks (Verlin-style shell navigation)
  useEffect(() => {
    const next = activePage || pathSegments[0] || "home";
    setPageKey(next);
  }, [activePage, pathSegments]);

  const theme = useMemo(
    () =>
      resolveShopTheme({
        primaryColor: content.primaryColor,
        secondaryColor: content.secondaryColor,
        accentColor: content.accentColor,
        surfaceColor: content.surfaceColor,
        themePalette: content.themePalette,
        logo: content.logo,
      }),
    [content]
  );
  const logo = useMemo(
    () => logoWithTheme(content.logo, content.brandName, content.city || "", theme),
    [content.logo, content.brandName, content.city, theme]
  );

  const page = pageFromPath(pageKey, content);
  const nav = content.nav?.length
    ? content.nav
    : content.pages.map((p) => ({ path: p.path, label: p.title }));

  const phone = content.whatsappNumber || content.contactPhone;
  const wa = phone
    ? `https://wa.me/${phone.replace(/\D/g, "").length === 10 ? "91" : ""}${phone.replace(/\D/g, "")}`
    : null;

  function go(path: string) {
    const p = path.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "home";
    if (onNavigate) {
      onNavigate(p);
      return;
    }
    setPageKey(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const isHome = pageKey === "home" || !page || page.path === "home";

  return (
    <div
      className={cn(!embedded && "min-h-screen", "flex flex-1 flex-col bg-background text-foreground")}
      style={shopThemeCssVars(theme) as CSSProperties}
      data-app-kind={content.appKind}
    >
      {/* Own header only when not embedded in StandaloneAppRuntime shell */}
      {!embedded ? (
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => go("home")}
              className="group flex items-center gap-2 text-left transition-opacity hover:opacity-90"
              aria-label={`${content.brandName} home`}
              title="Go to home"
            >
              {logo.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.imageUrl}
                  alt={`${content.brandName} logo`}
                  className="h-9 w-9 rounded-xl object-cover"
                />
              ) : (
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
                  style={{
                    background: `linear-gradient(145deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                  }}
                >
                  {logo.initials}
                </span>
              )}
              <span>
                <span className="block text-sm font-semibold" style={{ color: theme.primary }}>
                  {content.brandName}
                </span>
                <span className="block text-[10px] text-text-muted">{content.tagline}</span>
              </span>
            </button>
            <nav className="flex flex-wrap gap-1 text-sm font-medium" aria-label="App pages">
              {nav.map((n) => (
                <button
                  key={n.path}
                  type="button"
                  onClick={() => go(n.path)}
                  className="rounded-lg px-2.5 py-1.5"
                  style={
                    pageKey === n.path
                      ? { background: withAlpha(theme.primary, 0.12), color: theme.primary }
                      : undefined
                  }
                >
                  {n.label}
                </button>
              ))}
            </nav>
          </div>
        </header>
      ) : null}

      {isHome && (
        <section className="relative overflow-hidden border-b border-border text-white">
          {content.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div
            className="absolute inset-0"
            style={{
              background: content.heroImageUrl
                ? `linear-gradient(120deg, ${theme.heroFrom}ee 0%, ${theme.secondary}99 50%, transparent 100%)`
                : `linear-gradient(135deg, ${theme.heroFrom}, ${theme.primary}, ${theme.heroTo})`,
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
            <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" />
              {content.appKind.replace(/-/g, " ")}
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
              {content.heroHeadline}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/95 md:text-lg">
              {content.heroSubheadline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => go(content.pages.find((p) => p.path !== "home")?.path || "features")}
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow"
              >
                {content.ctaLabel}
              </button>
              {content.secondaryCtaLabel ? (
                <button
                  type="button"
                  onClick={() =>
                    go(
                      content.pages.find((p) => p.path === "dashboard")?.path ||
                        content.pages.find((p) => p.path === "about")?.path ||
                        "about"
                    )
                  }
                  className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur"
                >
                  {content.secondaryCtaLabel}
                </button>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {isHome ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold" style={{ color: theme.secondary }}>
            Highlights
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(content.features || []).map((f, i) => (
              <article
                key={f.id}
                className="rounded-2xl border bg-card p-4 shadow-sm"
                style={{
                  borderColor: withAlpha(theme.palette[i % theme.palette.length], 0.4),
                  borderTopWidth: 3,
                  borderTopColor: theme.palette[i % theme.palette.length],
                }}
              >
                <p className="text-2xl" aria-hidden>
                  {f.icon || "✨"}
                </p>
                <h3 className="mt-2 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{f.body}</p>
              </article>
            ))}
          </div>
          {content.trustBadges?.length ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {content.trustBadges.map((b, i) => (
                <span
                  key={b}
                  className="rounded-full border bg-card px-3 py-1 text-xs font-medium"
                  style={{ borderColor: withAlpha(theme.palette[i % theme.palette.length], 0.4) }}
                >
                  {b}
                </span>
              ))}
            </div>
          ) : null}

          {/* Quick links to all app pages — keep navigation obvious */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold" style={{ color: theme.secondary }}>
              Explore
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {nav
                .filter((n) => n.path !== "home")
                .map((n, i) => (
                  <button
                    key={n.path}
                    type="button"
                    onClick={() => go(n.path)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={{
                      borderColor: withAlpha(theme.palette[i % theme.palette.length], 0.45),
                      color: theme.primary,
                    }}
                  >
                    {n.label}
                  </button>
                ))}
            </div>
          </div>
        </section>
      ) : null}

      {!isHome && page ? (
        <section className="mx-auto max-w-3xl flex-1 px-4 py-12">
          <button
            type="button"
            onClick={() => go("home")}
            className="mb-4 text-xs font-medium underline"
            style={{ color: theme.primary }}
          >
            ← Back to home
          </button>
          <h1 className="text-2xl font-semibold" style={{ color: theme.secondary }}>
            {page.headline || page.title}
          </h1>
          <div
            className="prose prose-sm mt-6 max-w-none text-text-secondary dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: (page.bodyHtml || "")
                .replace(/<script\b[\s\S]*?<\/script>/gi, "")
                .replace(/\son\w+\s*=/gi, " data-x="),
            }}
          />
          {page.path === "faq" && content.faqs?.length ? (
            <div className="mt-8 space-y-3">
              {content.faqs.map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <h2 className="font-semibold">{f.question}</h2>
                  <p className="mt-2 text-sm text-text-secondary">{f.answer}</p>
                </div>
              ))}
            </div>
          ) : null}
          {page.path === "contact" ? (
            <ul className="mt-8 space-y-3 text-sm">
              {content.contactEmail ? (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" style={{ color: theme.primary }} />
                  <a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a>
                </li>
              ) : null}
              {content.contactPhone ? (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" style={{ color: theme.secondary }} />
                  <a href={`tel:${content.contactPhone}`}>{content.contactPhone}</a>
                </li>
              ) : null}
              {wa ? (
                <li>
                  <a
                    href={wa}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: theme.primary }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
          {page.ctaLabel ? (
            <button
              type="button"
              onClick={() => go("contact")}
              className="mt-8 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: theme.primary }}
            >
              {page.ctaLabel}
            </button>
          ) : null}
        </section>
      ) : null}

      <AppBuilderFooter
        content={{
          extensionId: "ecom-local-shop",
          brandName: content.brandName,
          tagline: content.tagline,
          description: content.description,
          primaryColor: content.primaryColor,
          secondaryColor: content.secondaryColor,
          accentColor: content.accentColor,
          city: content.city || "",
          currency: "INR",
          contactEmail: content.contactEmail,
          contactPhone: content.contactPhone,
          whatsappNumber: content.whatsappNumber,
          address: content.address || "",
          heroHeadline: content.heroHeadline,
          heroSubheadline: content.heroSubheadline,
          aboutHtml: content.aboutHtml,
          products: [],
          categories: [],
          faqs: content.faqs,
          ctaLabel: content.ctaLabel,
          footerNote: content.footerNote,
          logo: content.logo,
          heroTheme: content.appKind,
          orderMethods: [],
          paymentMethods: [],
          trustBadges: content.trustBadges,
          ownerHighlights: [],
        }}
        theme={theme}
        exploreLinks={nav.map((n) => ({ key: n.path, label: n.label }))}
        onNavigate={(p) => go(p)}
      />
    </div>
  );
}
