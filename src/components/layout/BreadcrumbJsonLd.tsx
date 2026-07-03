import type { BreadcrumbItem } from "@/components/layout/Breadcrumbs";

const SITE_ORIGIN = "https://www.verlinlabs.com";

export function BreadcrumbJsonLd({
  items,
  currentPath,
}: {
  items: BreadcrumbItem[];
  currentPath?: string;
}) {
  if (items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const href = item.href ?? (index === items.length - 1 ? currentPath : undefined);
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        ...(href ? { item: `${SITE_ORIGIN}${href}` } : {}),
      };
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}