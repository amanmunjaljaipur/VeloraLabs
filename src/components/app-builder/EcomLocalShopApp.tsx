"use client";

import type { EcomLocalShopContent, EcomProduct, ShopLogo } from "@/lib/app-builder/types";
import { cn } from "@/lib/utils";
import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type PageKey = "home" | "shop" | "about" | "contact" | "faq";

function ShopLogoMark({
  logo,
  brandName,
  size = "md",
}: {
  logo: ShopLogo;
  brandName: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-2xl font-bold text-white shadow-md",
        dim
      )}
      style={{ background: `linear-gradient(145deg, ${logo.bgFrom}, ${logo.bgTo})` }}
      title={`${brandName} · ${logo.motif}`}
      aria-label={`${brandName} logo`}
    >
      <span className="absolute -right-1 -top-1 text-base drop-shadow" aria-hidden>
        {logo.emoji}
      </span>
      <span className="tracking-tight">{logo.initials}</span>
    </div>
  );
}

function whatsappHref(number?: string, brand?: string): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const n = digits.length === 10 ? `91${digits}` : digits;
  const text = encodeURIComponent(`Hi ${brand || ""}! I saw your shop online and want to order.`);
  return `https://wa.me/${n}?text=${text}`;
}

export function EcomLocalShopApp({
  content,
  basePath,
  pathSegments = [],
}: {
  content: EcomLocalShopContent;
  basePath: string;
  pathSegments?: string[];
}) {
  const page: PageKey = useMemo(() => {
    const seg = pathSegments[0] || "home";
    if (seg === "shop" || seg === "about" || seg === "contact" || seg === "faq") return seg;
    return "home";
  }, [pathSegments]);

  const [category, setCategory] = useState("");
  const products = useMemo(() => {
    if (!category) return content.products;
    return content.products.filter((p) => p.category === category);
  }, [content.products, category]);

  const accent = content.primaryColor || "#0d9488";
  const logo: ShopLogo = content.logo || {
    initials: content.brandName.slice(0, 2).toUpperCase(),
    emoji: "🏪",
    motif: "local",
    bgFrom: accent,
    bgTo: "#0a1628",
    badge: content.city,
  };
  const wa = whatsappHref(content.whatsappNumber || content.contactPhone, content.brandName);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href={basePath} className="flex items-center gap-2.5">
            <ShopLogoMark logo={logo} brandName={content.brandName} size="sm" />
            <span>
              <span className="block text-base font-semibold tracking-tight" style={{ color: accent }}>
                {content.brandName}
              </span>
              <span className="block text-[11px] text-text-muted">{content.city}</span>
            </span>
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm font-medium">
            {(
              [
                ["home", "Home"],
                ["shop", "Products"],
                ["about", "About"],
                ["faq", "Help"],
                ["contact", "Contact"],
              ] as const
            ).map(([key, label]) => (
              <Link
                key={key}
                href={key === "home" ? basePath : `${basePath}/${key}`}
                className={cn(
                  "rounded-lg px-3 py-1.5 transition hover:bg-muted",
                  page === key && "bg-muted"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {page === "home" && (
        <>
          <section
            className="relative overflow-hidden border-b border-border px-4 py-14 text-white md:py-20"
            style={{
              background: `linear-gradient(135deg, ${logo.bgFrom}, ${logo.bgTo})`,
            }}
          >
            {/* Location motif pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 30%, white 0 2px, transparent 3px),
                  radial-gradient(circle at 80% 70%, white 0 1.5px, transparent 2px)`,
                backgroundSize: "48px 48px",
              }}
              aria-hidden
            />
            <div className="relative mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                  <span aria-hidden>{logo.emoji}</span>
                  {logo.badge || content.city}
                </p>
                <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                  {content.heroHeadline}
                </h1>
                <p className="mt-4 text-base text-white/90 md:text-lg">{content.heroSubheadline}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`${basePath}/shop`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {content.ctaLabel}
                  </Link>
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Order on WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col items-center gap-3 self-center">
                <ShopLogoMark logo={logo} brandName={content.brandName} size="lg" />
                <p className="max-w-[12rem] text-center text-xs text-white/80">
                  Logo colours inspired by {content.city}
                </p>
              </div>
            </div>
          </section>

          {(content.trustBadges?.length || content.orderMethods?.length) && (
            <section className="border-b border-border bg-muted/30">
              <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 py-4 text-xs font-medium text-text-secondary">
                {content.trustBadges?.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1"
                  >
                    <Sparkles className="h-3 w-3" style={{ color: accent }} />
                    {b}
                  </span>
                ))}
                {content.openingHours ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1">
                    <Clock className="h-3 w-3" style={{ color: accent }} />
                    {content.openingHours}
                  </span>
                ) : null}
                {content.deliveryNote ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1">
                    <Truck className="h-3 w-3" style={{ color: accent }} />
                    {content.deliveryNote}
                  </span>
                ) : null}
              </div>
            </section>
          )}

          {content.ownerHighlights?.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 pt-10">
              <h2 className="text-lg font-semibold">Why shop with us</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {content.ownerHighlights.map((h) => (
                  <li
                    key={h}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-text-secondary"
                  >
                    <span className="mr-2" style={{ color: accent }}>
                      ✓
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-xl font-semibold">Popular picks</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.products
                .filter((p) => p.featured)
                .concat(content.products)
                .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
                .slice(0, 3)
                .map((p) => (
                  <ProductCard key={p.id} product={p} accent={accent} logo={logo} />
                ))}
            </div>
          </section>
        </>
      )}

      {page === "shop" && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-text-secondary">{content.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                !category ? "border-transparent text-white" : "border-border"
              )}
              style={!category ? { background: accent } : undefined}
            >
              All
            </button>
            {content.categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  category === c ? "border-transparent text-white" : "border-border"
                )}
                style={category === c ? { background: accent } : undefined}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} accent={accent} logo={logo} />
            ))}
          </div>
          {wa ? (
            <p className="mt-10 text-center text-sm text-text-secondary">
              Like something?{" "}
              <a href={wa} className="font-semibold underline" style={{ color: accent }}>
                Message us on WhatsApp
              </a>{" "}
              — we will guide you step by step.
            </p>
          ) : null}
        </section>
      )}

      {page === "about" && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <div className="mb-6 flex items-center gap-3">
            <ShopLogoMark logo={logo} brandName={content.brandName} />
            <div>
              <h1 className="text-2xl font-semibold">About {content.brandName}</h1>
              <p className="text-sm text-text-muted">{logo.badge}</p>
            </div>
          </div>
          <div
            className="prose prose-sm max-w-none text-text-secondary dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content.aboutHtml }}
          />
          {content.languageNote ? (
            <p className="mt-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              {content.languageNote}
            </p>
          ) : null}
        </section>
      )}

      {page === "faq" && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-2xl font-semibold">Help & FAQ</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Simple answers — no tech talk.
          </p>
          <div className="mt-6 space-y-4">
            {content.faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <h2 className="font-semibold text-foreground">{f.question}</h2>
                <p className="mt-2 text-sm text-text-secondary">{f.answer}</p>
              </div>
            ))}
          </div>
          {(content.paymentMethods?.length || content.orderMethods?.length) && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {content.orderMethods?.length ? (
                <div className="rounded-xl border border-border p-4">
                  <h3 className="text-sm font-semibold">Ways to order</h3>
                  <ul className="mt-2 list-inside list-disc text-sm text-text-secondary">
                    {content.orderMethods.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {content.paymentMethods?.length ? (
                <div className="rounded-xl border border-border p-4">
                  <h3 className="text-sm font-semibold">Payment</h3>
                  <ul className="mt-2 list-inside list-disc text-sm text-text-secondary">
                    {content.paymentMethods.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>
      )}

      {page === "contact" && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-2xl font-semibold">Contact</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Reach {content.brandName} in {content.city}. We reply personally.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {content.contactEmail ? (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" style={{ color: accent }} />
                <a href={`mailto:${content.contactEmail}`} className="hover:underline">
                  {content.contactEmail}
                </a>
              </li>
            ) : null}
            {content.contactPhone ? (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" style={{ color: accent }} />
                <a href={`tel:${content.contactPhone}`} className="hover:underline">
                  {content.contactPhone}
                </a>
              </li>
            ) : null}
            {wa ? (
              <li>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
                  style={{ background: accent }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </li>
            ) : null}
            {content.address ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
                <span>{content.address}</span>
              </li>
            ) : null}
            {content.openingHours ? (
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: accent }} />
                <span>{content.openingHours}</span>
              </li>
            ) : null}
          </ul>
        </section>
      )}

      <footer className="border-t border-border bg-muted/20 py-8 text-center text-xs text-text-muted">
        <div className="mb-3 flex justify-center">
          <ShopLogoMark logo={logo} brandName={content.brandName} size="sm" />
        </div>
        <p>{content.footerNote}</p>
        <p className="mt-2">
          Built with Verlin Labs App Builder ·{" "}
          <Link href="/admin/app-builder" className="hover:underline" style={{ color: accent }}>
            Studio
          </Link>
        </p>
      </footer>
    </div>
  );
}

function ProductCard({
  product,
  accent,
  logo,
}: {
  product: EcomProduct;
  accent: string;
  logo: ShopLogo;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div
        className="relative flex h-40 flex-col items-center justify-center gap-1 text-white"
        style={{ background: `linear-gradient(145deg, ${logo.bgFrom}dd, ${logo.bgTo})` }}
        aria-hidden
      >
        <span className="text-5xl drop-shadow-sm">{product.emoji || "🛍️"}</span>
        <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
          {product.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{product.description}</p>
        <p className="mt-3 text-base font-semibold" style={{ color: accent }}>
          {product.price}
        </p>
      </div>
    </article>
  );
}
