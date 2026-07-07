import type { SiteFaqCategory } from "@/lib/cms/faq-content-types";
import { FaqPageJsonLd } from "@/components/seo/FaqPageJsonLd";

import { SITE_ORIGIN } from "@/lib/seo";
import { buildFaqPageJsonLd, toFaqSchemaItems } from "@/lib/faq-schema";

export function FaqJsonLd({ categories }: { categories: SiteFaqCategory[] }) {
  const items = categories.flatMap((category) => category.items);
  const jsonLd = {
    ...buildFaqPageJsonLd(toFaqSchemaItems(items), "/faq", SITE_ORIGIN),
    name: "Verlin Labs AI Training FAQ",
    description:
      "Frequently asked questions about free sessions, course tracks, pricing, enrollment, and clarity-first AI learning at Verlin Labs.",
    publisher: {
      "@type": "Organization",
      name: "Verlin Labs",
      url: SITE_ORIGIN,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}