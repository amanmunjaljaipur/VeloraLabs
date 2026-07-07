import {
  buildFaqPageJsonLd,
  type FaqSchemaItem,
  toFaqSchemaItems,
} from "@/lib/faq-schema";
import type { AccordionItem } from "@/components/ui/Accordion";
import { SITE_ORIGIN } from "@/lib/seo";

interface FaqPageJsonLdProps {
  items: readonly FaqSchemaItem[] | readonly AccordionItem[];
  path: string;
}

export function FaqPageJsonLd({ items, path }: FaqPageJsonLdProps) {
  const jsonLd = buildFaqPageJsonLd(toFaqSchemaItems(items), path, SITE_ORIGIN);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}