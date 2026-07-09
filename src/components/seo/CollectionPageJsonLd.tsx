import { SITE_ORIGIN } from "@/lib/seo";

export interface CollectionItem {
  name: string;
  url: string;
  description?: string;
}

export function CollectionPageJsonLd({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description: string;
  path: string;
  items: CollectionItem[];
}) {
  const pageUrl = `${SITE_ORIGIN}${path}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: `${SITE_ORIGIN}${item.url}`,
        ...(item.description ? { description: item.description } : {}),
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}