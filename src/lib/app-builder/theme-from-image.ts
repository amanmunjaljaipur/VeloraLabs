/**
 * Build brand theme colours from a logo / reference image palette.
 * Uses sampled hex colours + optional LLM polish when platform AI is available.
 */

import { callUserLlm, parseJsonObject } from "@/lib/app-builder/llm";
import { resolveAppBuilderSecrets } from "@/lib/app-builder/platform-llm";

export type ThemeSuggestion = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  themePalette: string[];
  logoBgFrom: string;
  logoBgTo: string;
  motif?: string;
  badge?: string;
  notes?: string;
};

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function normalizeHex(input: string, fallback = "#0d9488"): string {
  const s = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`.toLowerCase();
  return fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex);
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((x) => clampByte(x).toString(16).padStart(2, "0"))
    .join("")}`;
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function saturate(hex: string, amount = 1.15): string {
  const { r, g, b } = hexToRgb(hex);
  const avg = (r + g + b) / 3;
  return rgbToHex(
    avg + (r - avg) * amount,
    avg + (g - avg) * amount,
    avg + (b - avg) * amount
  );
}

function darken(hex: string, factor = 0.55): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}

function lighten(hex: string, factor = 0.35): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
}

/** Prefer saturated mid-tones for brand colour; skip near-white/black */
export function pickBrandColours(palette: string[]): ThemeSuggestion {
  const cleaned = palette.map((c) => normalizeHex(c)).filter(Boolean);
  const ranked = cleaned
    .map((hex) => {
      const { r, g, b } = hexToRgb(hex);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const lum = luminance(hex);
      // Score: colourful mid-tones win
      const score = sat * 2 - Math.abs(lum - 0.45) * 1.2;
      return { hex, score, sat, lum };
    })
    .filter((c) => c.lum > 0.08 && c.lum < 0.92)
    .sort((a, b) => b.score - a.score);

  const primary =
    ranked[0]?.hex ||
    cleaned.find((c) => luminance(c) > 0.15 && luminance(c) < 0.85) ||
    cleaned[0] ||
    "#0d9488";

  const secondary =
    ranked.find((c) => c.hex !== primary && Math.abs(c.lum - luminance(primary)) > 0.12)?.hex ||
    darken(primary, 0.45);

  const logoBgFrom = saturate(primary, 1.1);
  const logoBgTo = darken(secondary, 0.65);
  const accent =
    ranked[2]?.hex ||
    ranked.find((c) => c.hex !== primary && c.hex !== secondary)?.hex ||
    lighten(primary, 0.2);
  const surface = lighten(primary, 0.88);
  const themePalette = [
    primary,
    secondary,
    accent,
    logoBgFrom,
    logoBgTo,
    ...ranked.slice(0, 4).map((r) => r.hex),
  ].filter((c, i, arr) => arr.indexOf(c) === i).slice(0, 6);

  return {
    primaryColor: primary,
    secondaryColor: secondary,
    accentColor: accent,
    surfaceColor: surface,
    themePalette,
    logoBgFrom,
    logoBgTo,
    notes: "Multi-colour theme pulled from the strongest tones in your image.",
  };
}

export async function suggestThemeFromPalette(input: {
  palette: string[];
  brandName?: string;
  city?: string;
}): Promise<ThemeSuggestion> {
  const base = pickBrandColours(input.palette);
  const secrets = resolveAppBuilderSecrets();
  if (!secrets || input.palette.length === 0) return base;

  try {
    const raw = await callUserLlm({
      secrets,
      temperature: 0.2,
      maxTokens: 400,
      timeoutMs: 25_000,
      messages: [
        {
          role: "system",
          content:
            "You help local shops pick multi-colour brand themes. Return ONLY JSON with keys: primaryColor, secondaryColor, accentColor, surfaceColor, themePalette (array of 4-6 #rrggbb), logoBgFrom, logoBgTo, motif, badge, notes. Keep primary readable for buttons. Badge is a short 2–4 word tag. themePalette must use distinct colours from the sample.",
        },
        {
          role: "user",
          content: JSON.stringify({
            brandName: input.brandName || "Shop",
            city: input.city || "",
            sampledColours: input.palette.slice(0, 8).map((c) => normalizeHex(c)),
            heuristic: base,
            task: "Refine into a cohesive multi-colour shop theme from these logo/image colours. Prefer colours close to the samples. Never return a single-colour theme.",
          }),
        },
      ],
    });
    const parsed = parseJsonObject<Partial<ThemeSuggestion>>(raw);
    const palette =
      Array.isArray(parsed.themePalette) && parsed.themePalette.length >= 2
        ? parsed.themePalette.map((c) => normalizeHex(String(c), base.primaryColor)).slice(0, 8)
        : base.themePalette;
    return {
      primaryColor: normalizeHex(parsed.primaryColor || base.primaryColor),
      secondaryColor: normalizeHex(parsed.secondaryColor || base.secondaryColor),
      accentColor: normalizeHex(parsed.accentColor || base.accentColor),
      surfaceColor: normalizeHex(parsed.surfaceColor || base.surfaceColor),
      themePalette: palette,
      logoBgFrom: normalizeHex(parsed.logoBgFrom || base.logoBgFrom),
      logoBgTo: normalizeHex(parsed.logoBgTo || base.logoBgTo),
      motif: typeof parsed.motif === "string" ? parsed.motif.slice(0, 40) : base.motif,
      badge: typeof parsed.badge === "string" ? parsed.badge.slice(0, 40) : base.badge,
      notes:
        typeof parsed.notes === "string"
          ? parsed.notes.slice(0, 160)
          : "Multi-colour theme refined with AI from your image.",
    };
  } catch {
    return { ...base, notes: "Theme built from your image colours." };
  }
}

/** Lighten helper exported for clients that want preview variants */
export { lighten, darken };
