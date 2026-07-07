import type { AccordionItem } from "@/components/ui/Accordion";

export interface SiteFaqCategory {
  id: string;
  title: string;
  description: string;
  items: AccordionItem[];
}