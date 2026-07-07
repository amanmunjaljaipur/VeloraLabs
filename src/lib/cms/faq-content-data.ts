import type { SiteFaqCategory } from "@/lib/cms/faq-content-types";
import { readCmsJson } from "@/lib/cms/store";

export type { SiteFaqCategory } from "@/lib/cms/faq-content-types";

interface FaqContentFile {
  categories: SiteFaqCategory[];
}

export function getSiteFaqCategories(): SiteFaqCategory[] {
  return readCmsJson<FaqContentFile>("faq-content.json").categories;
}

export function getTotalFaqCount(): number {
  return getSiteFaqCategories().reduce((sum, cat) => sum + cat.items.length, 0);
}