"use client";

import type { EcomLocalShopContent, EcomProduct } from "@/lib/app-builder/types";
import { cn } from "@/lib/utils";
import { Mail, MapPin, Phone, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type PageKey = "home" | "shop" | "about" | "contact" | "faq";

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href={basePath} className="text-lg font-semibold tracking-tight" style={{ color: accent }}>
            {content.brandName}
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm font-medium">
            {(
              [
                ["home", "Home"],
                ["shop", "Shop"],
                ["about", "About"],
                ["faq", "FAQ"],
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
            className="border-b border-border px-4 py-16 text-white md:py-24"
            style={{ background: `linear-gradient(135deg, ${accent}, #0a1628)` }}
          >
            <div className="mx-auto max-w-6xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                {content.city} · Local shop
              </p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
                {content.heroHeadline}
              </h1>
              <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">
                {content.heroSubheadline}
              </p>
              <Link
                href={`${basePath}/shop`}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900"
              >
                <ShoppingBag className="h-4 w-4" />
                {content.ctaLabel}
              </Link>
            </div>
          </section>
          <section className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-xl font-semibold">Featured</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.products
                .filter((p) => p.featured)
                .concat(content.products)
                .slice(0, 3)
                .map((p) => (
                  <ProductCard key={p.id} product={p} accent={accent} />
                ))}
            </div>
          </section>
        </>
      )}

      {page === "shop" && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-semibold">Shop</h1>
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
              <ProductCard key={p.id} product={p} accent={accent} />
            ))}
          </div>
        </section>
      )}

      {page === "about" && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-2xl font-semibold">About {content.brandName}</h1>
          <div
            className="prose prose-sm mt-6 max-w-none text-text-secondary dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content.aboutHtml }}
          />
        </section>
      )}

      {page === "faq" && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-2xl font-semibold">FAQ</h1>
          <div className="mt-6 space-y-4">
            {content.faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <h2 className="font-semibold text-foreground">{f.question}</h2>
                <p className="mt-2 text-sm text-text-secondary">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {page === "contact" && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-2xl font-semibold">Contact</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Reach {content.brandName} in {content.city}.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {content.contactEmail ? (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-teal" />
                <a href={`mailto:${content.contactEmail}`} className="hover:underline">
                  {content.contactEmail}
                </a>
              </li>
            ) : null}
            {content.contactPhone ? (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-teal" />
                <a href={`tel:${content.contactPhone}`} className="hover:underline">
                  {content.contactPhone}
                </a>
              </li>
            ) : null}
            {content.address ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                <span>{content.address}</span>
              </li>
            ) : null}
          </ul>
        </section>
      )}

      <footer className="border-t border-border bg-muted/20 py-8 text-center text-xs text-text-muted">
        <p>{content.footerNote}</p>
        <p className="mt-2">
          Built with Verlin Labs App Builder ·{" "}
          <Link href="/admin/app-builder" className="text-teal hover:underline">
            Studio
          </Link>
        </p>
      </footer>
    </div>
  );
}

function ProductCard({ product, accent }: { product: EcomProduct; accent: string }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div
        className="flex h-36 items-center justify-center text-4xl font-bold text-white/90"
        style={{ background: `linear-gradient(145deg, ${accent}cc, #0a1628)` }}
        aria-hidden
      >
        {product.name.slice(0, 1)}
      </div>
      <div className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          {product.category}
        </p>
        <h3 className="mt-1 font-semibold text-foreground">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{product.description}</p>
        <p className="mt-3 text-base font-semibold" style={{ color: accent }}>
          {product.price}
        </p>
      </div>
    </article>
  );
}
