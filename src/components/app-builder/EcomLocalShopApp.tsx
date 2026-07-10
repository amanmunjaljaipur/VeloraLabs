"use client";

import { AppBuilderFooter } from "@/components/app-builder/AppBuilderFooter";
import {
  logoWithTheme,
  resolveShopTheme,
  shopThemeCssVars,
  withAlpha,
  type ShopThemeTokens,
} from "@/lib/app-builder/shop-theme";
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
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

type PageKey = "home" | "shop" | "about" | "contact" | "faq";

const PAGE_KEYS: PageKey[] = ["home", "shop", "about", "contact", "faq"];

function parsePage(seg?: string): PageKey {
  if (seg === "shop" || seg === "about" || seg === "contact" || seg === "faq") return seg;
  return "home";
}

function ShopLogoMark({
  logo,
  brandName,
  size = "md",
}: {
  logo: ShopLogo;
  brandName: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(logo.imageUrl) && !imgFailed;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl font-bold text-white shadow-md",
        dim
      )}
      style={
        showImg
          ? undefined
          : { background: `linear-gradient(145deg, ${logo.bgFrom}, ${logo.bgTo})` }
      }
      title={`${brandName} · ${logo.mode === "upload" ? "Your logo" : logo.motif}`}
      aria-label={`${brandName} logo`}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.imageUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <>
          <span className="absolute -right-1 -top-1 text-base drop-shadow" aria-hidden>
            {logo.emoji}
          </span>
          <span className="tracking-tight">{logo.initials}</span>
        </>
      )}
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
  embedded = false,
  onNavigate,
  slug,
  appUser,
}: {
  content: EcomLocalShopContent;
  basePath: string;
  pathSegments?: string[];
  /** When true, parent StandaloneAppRuntime owns chrome (header/auth) */
  embedded?: boolean;
  onNavigate?: (page: PageKey) => void;
  slug?: string;
  appUser?: { email: string; name: string } | null;
}) {
  // Client-side page state — avoids full RSC re-fetch (which was 404ing when Blob lag/empty seed)
  const [localPage, setLocalPage] = useState<PageKey>(() => parsePage(pathSegments[0]));
  const [category, setCategory] = useState("");
  const [orderMsg, setOrderMsg] = useState("");

  // When embedded, parent drives the route via pathSegments
  const page: PageKey = embedded ? parsePage(pathSegments[0]) : localPage;

  const go = useCallback(
    (next: PageKey) => {
      if (onNavigate) {
        onNavigate(next);
        return;
      }
      setLocalPage(next);
      const url = next === "home" ? basePath : `${basePath}/${next}`;
      if (typeof window !== "undefined") {
        window.history.pushState({ appPage: next }, "", url);
      }
    },
    [basePath, onNavigate]
  );

  useEffect(() => {
    if (embedded || onNavigate) return;
    const onPop = () => {
      if (typeof window === "undefined") return;
      const path = window.location.pathname.replace(/\/$/, "");
      const base = basePath.replace(/\/$/, "");
      const rest = path.startsWith(base) ? path.slice(base.length).replace(/^\//, "") : "";
      const seg = rest.split("/").filter(Boolean)[0];
      setLocalPage(parsePage(seg));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [basePath, embedded, onNavigate]);

  async function placeOrder(product: EcomProduct) {
    if (!slug) return;
    setOrderMsg("");
    const res = await fetch(`/api/apps/${slug}/admin/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: appUser?.name || "Guest",
        customerEmail: appUser?.email || "",
        items: [{ productId: product.id, name: product.name, price: product.price, qty: 1 }],
        note: "Ordered from shop product card",
      }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setOrderMsg(data.error || "Could not place order — sign in first or add your email on contact.");
      return;
    }
    setOrderMsg(`Order placed for ${product.name}. The shop will contact you.`);
  }

  const products = useMemo(() => {
    if (!category) return content.products;
    return content.products.filter((p) => p.category === category);
  }, [content.products, category]);

  const theme = useMemo(() => resolveShopTheme(content), [content]);
  const logo: ShopLogo = useMemo(
    () => logoWithTheme(content.logo, content.brandName, content.city, theme),
    [content.logo, content.brandName, content.city, theme]
  );
  const wa = whatsappHref(content.whatsappNumber || content.contactPhone, content.brandName);

  const navItems: Array<[PageKey, string]> = [
    ["home", "Home"],
    ["shop", "Products"],
    ["about", "About"],
    ["faq", "Help"],
    ["contact", "Contact"],
  ];

  return (
    <div
      className={cn(!embedded && "min-h-screen", "bg-background text-foreground")}
      style={shopThemeCssVars(theme) as CSSProperties}
    >
      {!embedded ? (
        <header className="border-b border-border bg-card/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <button type="button" onClick={() => go("home")} className="flex items-center gap-2.5 text-left">
              <ShopLogoMark logo={logo} brandName={content.brandName} size="sm" />
              <span>
                <span
                  className="block text-base font-semibold tracking-tight"
                  style={{ color: theme.primary }}
                >
                  {content.brandName}
                </span>
                <span className="block text-[11px] text-text-muted">{content.city}</span>
              </span>
            </button>
            <nav className="flex flex-wrap gap-1 text-sm font-medium">
              {navItems.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => go(key)}
                  className={cn("rounded-lg px-3 py-1.5 transition")}
                  style={
                    page === key
                      ? { background: withAlpha(theme.primary, 0.12), color: theme.primary }
                      : undefined
                  }
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </header>
      ) : null}

      {orderMsg ? (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">{orderMsg}</p>
        </div>
      ) : null}

      {page === "home" && (
        <>
          <section
            className="relative overflow-hidden border-b border-border text-white"
            data-tour="hero"
          >
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
                  ? `linear-gradient(120deg, ${theme.heroFrom}ee 0%, ${theme.secondary}99 40%, ${theme.heroTo}66 70%, transparent 100%)`
                  : `linear-gradient(135deg, ${theme.heroFrom} 0%, ${theme.primary} 45%, ${theme.heroTo} 100%)`,
              }}
            />
            {/* Multi-colour accent ribbon */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5"
              style={{
                background: `linear-gradient(90deg, ${theme.palette.map((c, i) => `${c} ${(i / Math.max(1, theme.palette.length - 1)) * 100}%`).join(", ")})`,
              }}
            />
            <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 md:flex-row md:items-center md:justify-between md:py-20">
              <div className="max-w-xl">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur">
                  <span aria-hidden>{logo.emoji}</span>
                  {logo.badge || content.city}
                </p>
                <h1 className="mt-4 text-3xl font-bold tracking-tight drop-shadow md:text-5xl">
                  {content.heroHeadline}
                </h1>
                <p className="mt-4 text-base text-white/95 md:text-lg">{content.heroSubheadline}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => go("shop")}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow"
                    style={{ background: theme.onPrimary === "#ffffff" ? "#fff" : theme.primary, color: theme.onPrimary === "#ffffff" ? theme.secondary : theme.onPrimary }}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {content.ctaLabel}
                  </button>
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur"
                      style={{ borderColor: withAlpha(theme.accent, 0.5) }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Order on WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col items-center gap-3 self-center">
                <div className="rounded-3xl bg-white/10 p-3 shadow-xl backdrop-blur">
                  <ShopLogoMark logo={logo} brandName={content.brandName} size="lg" />
                </div>
                <p className="max-w-[12rem] text-center text-xs text-white/90">
                  {logo.mode === "upload"
                    ? "Your logo"
                    : `Logo designed for ${content.city}`}
                </p>
              </div>
            </div>
          </section>

          {content.galleryImageUrls && content.galleryImageUrls.length > 0 ? (
            <section className="border-b border-border bg-muted/20">
              <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 py-4 sm:grid-cols-4">
                {content.galleryImageUrls.slice(0, 4).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="aspect-[4/3] w-full rounded-xl object-cover shadow-sm"
                    loading="lazy"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {(content.trustBadges?.length || content.orderMethods?.length) && (
            <section
              className="border-b border-border"
              style={{ background: withAlpha(theme.surface, 0.85) }}
            >
              <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 py-4 text-xs font-medium text-text-secondary">
                {content.trustBadges?.map((b, bi) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1"
                    style={{
                      borderColor: withAlpha(theme.palette[bi % theme.palette.length], 0.35),
                    }}
                  >
                    <Sparkles
                      className="h-3 w-3"
                      style={{ color: theme.palette[bi % theme.palette.length] }}
                    />
                    {b}
                  </span>
                ))}
                {content.openingHours ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1"
                    style={{ borderColor: withAlpha(theme.secondary, 0.35) }}
                  >
                    <Clock className="h-3 w-3" style={{ color: theme.secondary }} />
                    {content.openingHours}
                  </span>
                ) : null}
                {content.deliveryNote ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1"
                    style={{ borderColor: withAlpha(theme.accent, 0.35) }}
                  >
                    <Truck className="h-3 w-3" style={{ color: theme.accent }} />
                    {content.deliveryNote}
                  </span>
                ) : null}
              </div>
            </section>
          )}

          {content.ownerHighlights?.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 pt-10">
              <h2 className="text-lg font-semibold" style={{ color: theme.secondary }}>
                Why shop with us
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {content.ownerHighlights.map((h, hi) => (
                  <li
                    key={h}
                    className="rounded-xl border bg-card px-4 py-3 text-sm text-text-secondary"
                    style={{
                      borderColor: withAlpha(theme.palette[hi % theme.palette.length], 0.4),
                      borderLeftWidth: 3,
                      borderLeftColor: theme.palette[hi % theme.palette.length],
                    }}
                  >
                    <span className="mr-2" style={{ color: theme.accent }}>
                      ✓
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mx-auto max-w-6xl px-4 py-12" data-tour="featured">
            <h2 className="text-xl font-semibold" style={{ color: theme.secondary }}>
              Popular picks
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.products
                .filter((p) => p.featured)
                .concat(content.products)
                .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
                .slice(0, 3)
                .map((p, pi) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    theme={theme}
                    logo={logo}
                    colorIndex={pi}
                    onOrder={slug ? () => void placeOrder(p) : undefined}
                  />
                ))}
            </div>
          </section>
        </>
      )}

      {page === "shop" && (
        <section className="mx-auto max-w-6xl px-4 py-10" data-tour="products">
          <h1 className="text-2xl font-semibold" style={{ color: theme.secondary }}>
            Products
          </h1>
          <p className="mt-1 text-sm text-text-secondary">{content.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                !category ? "border-transparent text-white" : "border-border"
              )}
              style={!category ? { background: theme.primary, color: theme.onPrimary } : undefined}
            >
              All
            </button>
            {content.categories.map((c, ci) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  category === c ? "border-transparent text-white" : "border-border"
                )}
                style={
                  category === c
                    ? {
                        background: theme.palette[ci % theme.palette.length],
                        color: theme.onPrimary,
                      }
                    : { borderColor: withAlpha(theme.palette[ci % theme.palette.length], 0.45) }
                }
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, pi) => (
              <ProductCard
                key={p.id}
                product={p}
                theme={theme}
                logo={logo}
                colorIndex={pi}
                onOrder={slug ? () => void placeOrder(p) : undefined}
              />
            ))}
          </div>
          {wa ? (
            <p className="mt-10 text-center text-sm text-text-secondary">
              Like something?{" "}
              <a
                href={wa}
                className="font-semibold underline"
                style={{ color: theme.primary }}
              >
                Message us on WhatsApp
              </a>{" "}
              — we will guide you step by step.
            </p>
          ) : null}
        </section>
      )}

      {page === "about" && (
        <section className="mx-auto max-w-3xl px-4 py-12" data-tour="about">
          <div className="mb-6 flex items-center gap-3">
            <ShopLogoMark logo={logo} brandName={content.brandName} />
            <div>
              <h1 className="text-2xl font-semibold">About {content.brandName}</h1>
              <p className="text-sm text-text-muted">{logo.badge}</p>
            </div>
          </div>
          {content.aboutImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.aboutImageUrl}
              alt=""
              className="mb-6 aspect-[16/9] w-full rounded-2xl object-cover shadow"
              loading="lazy"
            />
          ) : null}
          <div
            className="prose prose-sm max-w-none text-text-secondary dark:prose-invert"
            dangerouslySetInnerHTML={{
              // Server also sanitizes on save; strip residual script handlers client-side
              __html: (content.aboutHtml || "")
                .replace(/<script\b[\s\S]*?<\/script>/gi, "")
                .replace(/\son\w+\s*=/gi, " data-x="),
            }}
          />
          {content.languageNote ? (
            <p className="mt-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              {content.languageNote}
            </p>
          ) : null}
        </section>
      )}

      {page === "faq" && (
        <section className="mx-auto max-w-3xl px-4 py-12" data-tour="faq">
          <h1 className="text-2xl font-semibold">Help & FAQ</h1>
          <p className="mt-1 text-sm text-text-secondary">Simple answers — no tech talk.</p>
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
        <section className="mx-auto max-w-3xl px-4 py-12" data-tour="contact">
          <h1 className="text-2xl font-semibold">Contact</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Reach {content.brandName} in {content.city}. We reply personally.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {content.contactEmail ? (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" style={{ color: theme.primary }} />
                <a href={`mailto:${content.contactEmail}`} className="hover:underline">
                  {content.contactEmail}
                </a>
              </li>
            ) : null}
            {content.contactPhone ? (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" style={{ color: theme.secondary }} />
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
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    color: theme.onPrimary,
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </li>
            ) : null}
            {content.address ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                <span>{content.address}</span>
              </li>
            ) : null}
            {content.openingHours ? (
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: theme.secondary }} />
                <span>{content.openingHours}</span>
              </li>
            ) : null}
          </ul>
        </section>
      )}

      {!PAGE_KEYS.includes(page) ? null : null}

      <AppBuilderFooter content={content} theme={theme} onNavigate={(p) => go(p)} />
    </div>
  );
}

function ProductCard({
  product,
  theme,
  logo,
  colorIndex = 0,
  onOrder,
}: {
  product: EcomProduct;
  theme: ShopThemeTokens;
  logo: ShopLogo;
  colorIndex?: number;
  onOrder?: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(product.image) && !imgFailed;
  const edge = theme.palette[colorIndex % theme.palette.length];

  return (
    <article
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
      style={{ borderColor: withAlpha(edge, 0.35) }}
    >
      <div
        className="relative flex h-44 flex-col items-center justify-center gap-1 overflow-hidden text-white"
        style={
          showImg
            ? undefined
            : {
                background: `linear-gradient(145deg, ${theme.gradientFrom}, ${edge}, ${theme.gradientTo})`,
              }
        }
      >
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-5xl drop-shadow-sm" aria-hidden>
            {product.emoji || "🛍️"}
          </span>
        )}
        <span
          className="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur"
          style={{ background: withAlpha(theme.secondary, 0.75) }}
        >
          {product.category}
        </span>
        <span
          className="absolute left-0 top-0 h-full w-1"
          style={{ background: edge }}
          aria-hidden
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{product.description}</p>
        <p className="mt-3 text-base font-semibold" style={{ color: theme.accent }}>
          {product.price}
        </p>
        {onOrder ? (
          <button
            type="button"
            onClick={onOrder}
            className="mt-3 w-full rounded-xl py-2 text-xs font-semibold"
            style={{ background: theme.primary, color: theme.onPrimary }}
          >
            Order this
          </button>
        ) : null}
      </div>
    </article>
  );
}
