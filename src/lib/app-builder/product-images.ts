/**
 * Search the open web (Wikimedia) + generate custom product photos
 * when owners add products in App Builder shops.
 */

import { isHttpUrl, productImageUrl, seedFrom } from "@/lib/app-builder/images";
import type { EcomProduct } from "@/lib/app-builder/types";

export type ProductImageOption = {
  url: string;
  source: "search" | "custom" | "user";
  label: string;
};

function productSearchQuery(input: {
  name: string;
  category?: string;
  description?: string;
}): string {
  const base = [input.name, input.category, input.description?.slice(0, 40)]
    .filter(Boolean)
    .join(" ")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return base || "local handmade product";
}

/** Wikimedia Commons file search - free, no API key. */
export async function searchWikimediaProductImages(
  query: string,
  limit = 6
): Promise<ProductImageOption[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrnamespace", "6"); // File:
    url.searchParams.set("gsrsearch", q);
    url.searchParams.set("gsrlimit", String(Math.min(limit, 10)));
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|mime");
    url.searchParams.set("iiurlwidth", "800");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "VerlinLabsAppBuilder/1.0 (product image search)" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            title?: string;
            imageinfo?: Array<{
              url?: string;
              thumburl?: string;
              mime?: string;
            }>;
          }
        >;
      };
    };

    const pages = Object.values(data.query?.pages || {});
    const out: ProductImageOption[] = [];
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      const mime = info?.mime || "";
      if (mime && !mime.startsWith("image/")) continue;
      const img = info?.thumburl || info?.url;
      if (!img || !isHttpUrl(img)) continue;
      out.push({
        url: img,
        source: "search",
        label: (page.title || "Web photo").replace(/^File:/, "").slice(0, 60),
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch (error) {
    console.error("[product-images] Wikimedia search failed:", error);
    return [];
  }
}

/** Several custom AI product shots from the product description. */
export function generateCustomProductImages(input: {
  name: string;
  category?: string;
  description?: string;
  brandName?: string;
  city?: string;
  count?: number;
}): ProductImageOption[] {
  const count = input.count ?? 4;
  const styles = [
    "studio product photography, soft light, white background",
    "lifestyle product photo, real home setting, natural light India",
    "close-up detail product shot, craftsmanship texture",
    "market stall display photo, warm tones, attractive packaging",
  ];
  const options: ProductImageOption[] = [];
  for (let i = 0; i < count; i++) {
    const seed = seedFrom(input.name, input.category || "", String(i), "custom");
    const prompt = [
      input.name,
      input.category,
      input.description?.slice(0, 80),
      input.brandName,
      input.city,
      styles[i % styles.length],
      "high quality product image",
    ]
      .filter(Boolean)
      .join(", ");
    const q = encodeURIComponent(prompt);
    options.push({
      url: `https://image.pollinations.ai/prompt/${q}?width=800&height=800&nologo=true&seed=${seed}&enhance=true`,
      source: "custom",
      label: `Custom photo ${i + 1}`,
    });
  }
  return options;
}

/**
 * Search the internet (Wikimedia) + build custom AI images for a product.
 */
export async function findProductImageOptions(input: {
  name: string;
  category?: string;
  description?: string;
  brandName?: string;
  city?: string;
}): Promise<ProductImageOption[]> {
  const query = productSearchQuery(input);
  const [searchHits, custom] = await Promise.all([
    searchWikimediaProductImages(query, 6),
    Promise.resolve(
      generateCustomProductImages({
        ...input,
        count: 4,
      })
    ),
  ]);

  // Prefer custom first (tailored), then web search
  const merged = [...custom, ...searchHits];
  const seen = new Set<string>();
  return merged.filter((o) => {
    if (seen.has(o.url)) return false;
    seen.add(o.url);
    return true;
  });
}

/**
 * When saving products: auto-attach a custom image if missing,
 * or refresh AI image when name changed and forceRegen is set.
 */
export function ensureProductImages(
  products: EcomProduct[],
  ctx: { brandName: string; city: string },
  opts?: { forceNewAi?: boolean }
): EcomProduct[] {
  return products.map((p) => {
    const hasUserImage =
      p.image &&
      isHttpUrl(p.image) &&
      !p.image.includes("pollinations.ai") &&
      !p.image.includes("wikimedia.org") &&
      !p.image.includes("wikipedia.org");

    if (hasUserImage && !opts?.forceNewAi) {
      return p;
    }

    if (p.image && isHttpUrl(p.image) && !opts?.forceNewAi) {
      return p;
    }

    return {
      ...p,
      image: productImageUrl({
        name: p.name,
        category: p.category,
        description: p.description,
        brandName: ctx.brandName,
        city: ctx.city,
      }),
    };
  });
}
