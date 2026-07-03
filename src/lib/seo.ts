import type { Metadata } from "next";

export const SITE_NAME = "Verlin Labs";

/**
 * Build per-page metadata with a page-specific OpenGraph/Twitter card.
 *
 * The root layout sets a title template ("%s | Verlin Labs") and a default
 * social card. Next.js does NOT automatically derive per-page OG titles from
 * that template, so every page would otherwise share the same OG title and
 * description. Use this helper on each page to give it its own social preview.
 */
export function createMetadata({
  title,
  description,
  path = "/",
  image = "/images/hero-side.jpg",
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  const ogTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      type: "website",
      url: path,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${title} — ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [image],
    },
  };
}
