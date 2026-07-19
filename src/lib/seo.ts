import type { Metadata } from "next";
import { trimMetaDescription } from "@/lib/meta-description";

export const SITE_NAME = "Verlin Labs";
export const SITE_ORIGIN = "https://www.verlinlabs.com";

const DEFAULT_OG_IMAGE = "/images/brand-hero-clarity.jpg";

/**
 * Build per-page metadata with canonical URLs, robots, and social cards.
 */
export function createMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  keywords,
  noIndex = false,
  type = "website",
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  keywords?: readonly string[];
  noIndex?: boolean;
  type?: "website" | "article";
  absoluteTitle?: boolean;
}): Metadata {
  const ogTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;

  const metaDescription = trimMetaDescription(description);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: metaDescription,
    ...(keywords?.length ? { keywords: [...keywords] } : {}),
    metadataBase: new URL(SITE_ORIGIN),
    alternates: { canonical: canonicalPath },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
    openGraph: {
      title: ogTitle,
      description: metaDescription,
      type,
      url: canonicalPath,
      siteName: SITE_NAME,
      locale: "en_IN",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${title} - ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: metaDescription,
      images: [image],
    },
  };
}