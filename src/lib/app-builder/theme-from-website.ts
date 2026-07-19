/**
 * Extract brand theme hints from a public website URL (SSRF-safe).
 * Used when owners paste their existing site for multi-colour theme.
 */

import { pickBrandColours, type ThemeSuggestion } from "@/lib/app-builder/theme-from-image";
import { suggestThemeFromPalette } from "@/lib/app-builder/theme-from-image";

function assertSafePublicUrl(urlStr: string): URL {
  let u: URL;
  try {
    u = new URL(urlStr.trim());
  } catch {
    throw new Error("Enter a valid website link (https://…)");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error("Website link must start with https://");
  }
  if (u.protocol === "http:" && process.env.NODE_ENV === "production") {
    throw new Error("Use an https:// website link in production");
  }
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    /^169\.254\./.test(host)
  ) {
    throw new Error("That website address cannot be used for theme research");
  }
  return u;
}

function extractHexColors(html: string): string[] {
  const found = new Set<string>();
  const re = /#([0-9a-fA-F]{6})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && found.size < 40) {
    found.add(`#${m[1].toLowerCase()}`);
  }
  // theme-color meta
  const themeMeta = html.match(
    /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i
  ) || html.match(/content=["']([^"']+)["'][^>]+name=["']theme-color["']/i);
  if (themeMeta?.[1]?.startsWith("#") && themeMeta[1].length >= 4) {
    found.add(themeMeta[1].slice(0, 7).toLowerCase());
  }
  const msTile = html.match(
    /msapplication-TileColor["'][^>]+content=["'](#[0-9a-fA-F]{6})/i
  );
  if (msTile?.[1]) found.add(msTile[1].toLowerCase());
  return [...found];
}

function extractLogoCandidate(html: string, base: URL): string | undefined {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]+href=["']([^"']+)["']/i,
    /href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i,
    /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
    /src=["']([^"']+)["'][^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      try {
        return new URL(m[1], base).href;
      } catch {
        // continue
      }
    }
  }
  return undefined;
}

export type WebsiteThemeResult = ThemeSuggestion & {
  websiteUrl: string;
  logoCandidateUrl?: string;
  sampledFrom: string;
};

export async function themeFromWebsiteUrl(
  websiteUrl: string,
  opts?: { brandName?: string; city?: string }
): Promise<WebsiteThemeResult> {
  const u = assertSafePublicUrl(websiteUrl);
  const res = await fetch(u.href, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "VerlinLabs-AppBuilder-Theme/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    throw new Error(`Could not open that website (${res.status}). Check the link.`);
  }
  const html = (await res.text()).slice(0, 400_000);
  const palette = extractHexColors(html);
  const logoCandidateUrl = extractLogoCandidate(html, u);

  if (palette.length === 0) {
    // Still return a neutral theme + logo if found
    const fallback = pickBrandColours(["#0d9488", "#0f766e", "#134e4a"]);
    return {
      ...fallback,
      websiteUrl: u.href,
      logoCandidateUrl,
      sampledFrom: "defaults (no colours found on page)",
      notes: logoCandidateUrl
        ? "No strong colours in HTML - try Build theme from logo after saving the logo link."
        : "No colours found. Upload a logo or theme photo instead.",
    };
  }

  const theme = await suggestThemeFromPalette({
    palette,
    brandName: opts?.brandName,
    city: opts?.city,
  });

  return {
    ...theme,
    websiteUrl: u.href,
    logoCandidateUrl,
    sampledFrom: `website HTML (${palette.length} colour samples)`,
  };
}
