/**
 * Multi-colour shop theme — never apply primary alone.
 * Every storefront surface should use primary + secondary + accent + gradients.
 */

import type { EcomLocalShopContent, ShopLogo } from "@/lib/app-builder/types";

export type ShopThemeTokens = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  muted: string;
  onPrimary: string;
  gradientFrom: string;
  gradientTo: string;
  heroFrom: string;
  heroTo: string;
  /** Full palette for chips, cards, accents (3–6 colours) */
  palette: string[];
};

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function normalizeHex(input: string | undefined, fallback: string): string {
  if (!input?.trim()) return fallback;
  const s = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`.toLowerCase();
  return fallback;
}

function hexToRgb(hex: string) {
  const h = normalizeHex(hex, "#000000");
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => clampByte(x).toString(16).padStart(2, "0")).join("")}`;
}

export function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Text colour that contrasts on the given background */
export function onColor(bg: string): string {
  return luminance(bg) > 0.55 ? "#0f172a" : "#ffffff";
}

/**
 * Resolve full multi-colour theme from content.
 * Falls back intelligently so older single-colour shops still get a palette.
 */
export function resolveShopTheme(content: Pick<
  EcomLocalShopContent,
  | "primaryColor"
  | "secondaryColor"
  | "accentColor"
  | "surfaceColor"
  | "themePalette"
  | "logo"
>): ShopThemeTokens {
  const primary = normalizeHex(content.primaryColor, "#0d9488");
  const secondary = normalizeHex(
    content.secondaryColor,
    mixHex(primary, "#0a1628", 0.55)
  );
  const accent = normalizeHex(
    content.accentColor,
    mixHex(primary, secondary, 0.35)
  );
  const surface = normalizeHex(
    content.surfaceColor,
    mixHex(primary, "#ffffff", 0.92)
  );
  const logo = content.logo;
  const gradientFrom = normalizeHex(logo?.bgFrom, primary);
  const gradientTo = normalizeHex(logo?.bgTo, secondary);

  const fromContent = (content.themePalette || [])
    .map((c) => normalizeHex(c, ""))
    .filter(Boolean);

  const palette =
    fromContent.length >= 2
      ? fromContent.slice(0, 8)
      : uniqueHexes([
          primary,
          secondary,
          accent,
          gradientFrom,
          gradientTo,
          mixHex(primary, accent, 0.5),
          mixHex(secondary, "#0a1628", 0.3),
        ]).slice(0, 6);

  return {
    primary,
    secondary,
    accent,
    surface,
    muted: mixHex(secondary, "#64748b", 0.5),
    onPrimary: onColor(primary),
    gradientFrom,
    gradientTo,
    heroFrom: gradientFrom,
    heroTo: gradientTo,
    palette,
  };
}

function uniqueHexes(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of list) {
    const n = normalizeHex(c, "");
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export function logoWithTheme(
  logo: ShopLogo | undefined,
  brandName: string,
  city: string,
  theme: ShopThemeTokens
): ShopLogo {
  return {
    initials: logo?.initials || brandName.slice(0, 2).toUpperCase(),
    emoji: logo?.emoji || "🏪",
    motif: logo?.motif || "local",
    bgFrom: logo?.bgFrom || theme.gradientFrom,
    bgTo: logo?.bgTo || theme.gradientTo,
    badge: logo?.badge || city,
    mode: logo?.mode,
    imageUrl: logo?.imageUrl,
  };
}

/** CSS variables for optional inline theme scope */
export function shopThemeCssVars(theme: ShopThemeTokens): Record<string, string> {
  return {
    "--shop-primary": theme.primary,
    "--shop-secondary": theme.secondary,
    "--shop-accent": theme.accent,
    "--shop-surface": theme.surface,
    "--shop-muted": theme.muted,
    "--shop-on-primary": theme.onPrimary,
    "--shop-gradient-from": theme.gradientFrom,
    "--shop-gradient-to": theme.gradientTo,
  };
}
