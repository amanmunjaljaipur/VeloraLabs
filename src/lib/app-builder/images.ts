/**
 * Visual assets for generated shops — product photos, hero, logo art.
 * Uses free prompt-to-image URLs (pollinations) so non-tech owners get a lively storefront
 * without uploading photos. User-provided logo URLs always win when set.
 */

import type { EcomProduct, ShopLogo } from "@/lib/app-builder/types";

export function seedFrom(...parts: string[]): number {
  const s = parts.join("|").toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 1_000_000;
}

/** Safe image URL from a text prompt (no API key). */
export function aiImageUrl(
  prompt: string,
  opts?: { width?: number; height?: number; seed?: number }
): string {
  const width = opts?.width ?? 960;
  const height = opts?.height ?? 640;
  const seed = opts?.seed ?? seedFrom(prompt);
  // nologo + private-ish seed so same product keeps same image
  const q = encodeURIComponent(
    `${prompt.trim()}, professional product photography, warm natural light, clean background, high quality, india market aesthetic`
  );
  return `https://image.pollinations.ai/prompt/${q}?width=${width}&height=${height}&nologo=true&seed=${seed}&enhance=true`;
}

export function heroImageUrl(input: {
  brandName: string;
  city: string;
  whatYouSell?: string;
  vibe?: string;
}): string {
  const focus = input.whatYouSell?.slice(0, 80) || "local handmade products";
  return aiImageUrl(
    `storefront hero for ${input.brandName} in ${input.city}, ${focus}, ${input.vibe || "warm welcoming"}, inviting local shop display`,
    { width: 1400, height: 800, seed: seedFrom(input.brandName, input.city, "hero") }
  );
}

export function aboutImageUrl(input: { brandName: string; city: string }): string {
  return aiImageUrl(
    `friendly local shop owner workspace for ${input.brandName}, ${input.city}, craft and care, documentary photo`,
    { width: 1000, height: 700, seed: seedFrom(input.brandName, "about") }
  );
}

export function productImageUrl(product: {
  name: string;
  category?: string;
  description?: string;
  brandName?: string;
  city?: string;
}): string {
  const bits = [
    product.name,
    product.category,
    product.description?.slice(0, 60),
    product.city,
    "product photo",
  ]
    .filter(Boolean)
    .join(", ");
  return aiImageUrl(bits, {
    width: 800,
    height: 800,
    seed: seedFrom(product.name, product.category || "", product.brandName || ""),
  });
}

/** Logo mark as AI image when owner asks us to design it */
export function generatedLogoImageUrl(input: {
  brandName: string;
  city: string;
  motif?: string;
}): string {
  return aiImageUrl(
    `minimal logo mark for shop "${input.brandName}", ${input.city}, ${input.motif || "local craft"} theme, simple icon, flat design, square, no text clutter, brand identity`,
    { width: 512, height: 512, seed: seedFrom(input.brandName, "logo") }
  );
}

export function isHttpUrl(value?: string): boolean {
  if (!value?.trim()) return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Parse logo preference from interview answers.
 * - "generate" / design / make / create → we design
 * - paste URL or "I have a logo" with logoUrl → upload
 */
export function resolveLogoChoice(answers: Record<string, string>): {
  mode: "generate" | "upload";
  imageUrl?: string;
} {
  const pref = (
    answers.logoPreference ||
    answers.logo ||
    answers.logoChoice ||
    ""
  ).toLowerCase();
  const urlCandidate =
    answers.logoUrl ||
    answers.logoLink ||
    answers.logoImage ||
    // URL embedded in preference answer
    (answers.logoPreference?.match(/https?:\/\/\S+/i)?.[0] ?? "");

  if (isHttpUrl(urlCandidate)) {
    return { mode: "upload", imageUrl: urlCandidate.trim() };
  }
  if (isHttpUrl(answers.logoPreference)) {
    return { mode: "upload", imageUrl: answers.logoPreference.trim() };
  }

  if (
    /have|my logo|own logo|upload|paste|link|url|photo of logo|already/.test(pref) &&
    !/design|create|make|generate|build|please make|for me/.test(pref)
  ) {
    // Said they have a logo but no URL yet — still generate placeholder art until they add URL
    return { mode: "generate" };
  }

  // Default: design for them (non-tech friendly)
  return { mode: "generate" };
}

export function enrichProductImages(
  products: EcomProduct[],
  ctx: { brandName: string; city: string }
): EcomProduct[] {
  return products.map((p) => ({
    ...p,
    image:
      p.image && isHttpUrl(p.image)
        ? p.image
        : productImageUrl({
            name: p.name,
            category: p.category,
            description: p.description,
            brandName: ctx.brandName,
            city: ctx.city,
          }),
  }));
}

export function applyLogoImage(
  logo: ShopLogo,
  choice: { mode: "generate" | "upload"; imageUrl?: string },
  brandName: string,
  city: string
): ShopLogo {
  if (choice.mode === "upload" && choice.imageUrl && isHttpUrl(choice.imageUrl)) {
    return {
      ...logo,
      mode: "upload",
      imageUrl: choice.imageUrl,
    };
  }
  return {
    ...logo,
    mode: "generate",
    imageUrl: generatedLogoImageUrl({
      brandName,
      city,
      motif: logo.motif,
    }),
  };
}
