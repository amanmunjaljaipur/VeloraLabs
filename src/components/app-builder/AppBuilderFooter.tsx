"use client";

import {
  resolveShopTheme,
  withAlpha,
  type ShopThemeTokens,
} from "@/lib/app-builder/shop-theme";
import type { EcomLocalShopContent } from "@/lib/app-builder/types";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

type FooterNavKey = "home" | "shop" | "about" | "faq" | "contact";

export function AppBuilderFooter({
  content,
  accent,
  theme: themeProp,
  onNavigate,
}: {
  content: EcomLocalShopContent;
  /** @deprecated use theme — kept for callers that only pass primary */
  accent?: string;
  theme?: ShopThemeTokens;
  onNavigate?: (page: FooterNavKey) => void;
}) {
  const theme =
    themeProp ||
    resolveShopTheme({
      ...content,
      primaryColor: accent || content.primaryColor,
    });
  const year = new Date().getFullYear();
  const logo = content.logo;
  const phone = content.whatsappNumber || content.contactPhone;

  const links: Array<{ key: FooterNavKey; label: string }> = [
    { key: "home", label: "Home" },
    { key: "shop", label: "Products" },
    { key: "about", label: "About" },
    { key: "faq", label: "Help" },
    { key: "contact", label: "Contact" },
  ];

  return (
    <footer
      className="mt-auto border-t border-border"
      style={{
        background: `linear-gradient(180deg, transparent 0%, ${withAlpha(theme.primary, 0.06)} 40%, ${withAlpha(theme.secondary, 0.1)} 100%)`,
      }}
      data-tour="footer"
    >
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${theme.palette.join(", ")})`,
        }}
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onNavigate?.("home")}
            className="flex items-center gap-2 text-left"
            aria-label={`${content.brandName} home`}
          >
            {logo?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo.imageUrl}
                alt={`${content.brandName} logo`}
                className="h-10 w-10 rounded-xl object-cover shadow"
              />
            ) : (
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white shadow"
                style={{
                  background: `linear-gradient(145deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                }}
              >
                {logo?.initials || content.brandName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <p className="font-semibold text-foreground" style={{ color: theme.primary }}>
                {content.brandName}
              </p>
              <p className="text-[11px] text-text-muted">{content.city}</p>
            </div>
          </button>
          <p className="text-sm text-text-secondary">
            {content.tagline || content.description?.slice(0, 120)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((l, i) => (
              <li key={l.key}>
                <button
                  type="button"
                  className="text-text-secondary hover:underline"
                  style={{ color: theme.palette[i % theme.palette.length] }}
                  onClick={() => onNavigate?.(l.key)}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            {content.contactEmail ? (
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: theme.primary }} />
                <a href={`mailto:${content.contactEmail}`} className="hover:underline">
                  {content.contactEmail}
                </a>
              </li>
            ) : null}
            {phone ? (
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: theme.secondary }} />
                <a href={`tel:${phone}`} className="hover:underline">
                  {phone}
                </a>
              </li>
            ) : null}
            {content.address ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: theme.accent }} />
                <span>{content.address}</span>
              </li>
            ) : null}
            {content.openingHours ? (
              <li className="text-xs text-text-muted">{content.openingHours}</li>
            ) : null}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Order</p>
          <p className="mt-3 text-sm text-text-secondary">
            {(content.orderMethods || []).slice(0, 3).join(" · ") ||
              "Message us to place an order"}
          </p>
          {phone ? (
            <a
              href={`https://wa.me/${phone.replace(/\D/g, "").length === 10 ? "91" : ""}${phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                color: theme.onPrimary,
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border/80 bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-center text-[11px] text-text-muted sm:flex-row sm:text-left">
          <p>
            {content.footerNote || `© ${year} ${content.brandName} · ${content.city}`}
          </p>
          <p>
            Built with{" "}
            <span className="font-semibold" style={{ color: theme.primary }}>
              Verlin Labs App Builder
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
