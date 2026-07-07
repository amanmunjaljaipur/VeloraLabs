import type { AccordionItem } from "@/components/ui/Accordion";

export interface FaqSchemaItem {
  question: string;
  answer: string;
  bullets?: string[];
}

export function faqAnswerText(answer: string, bullets?: string[]): string {
  const parts = [answer.replace(/\n+/g, " ").trim()];
  if (bullets?.length) {
    parts.push(bullets.join(" "));
  }
  return parts.join(" ");
}

export function toFaqSchemaItems(
  items: readonly AccordionItem[] | FaqSchemaItem[]
): FaqSchemaItem[] {
  return items.map((item) => ({
    question: item.question,
    answer: item.answer,
    bullets: "bullets" in item ? item.bullets : undefined,
  }));
}

export function buildFaqPageJsonLd(items: FaqSchemaItem[], path: string, origin: string) {
  const url = path === "/" ? origin : `${origin}${path.startsWith("/") ? path : `/${path}`}`;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faqAnswerText(item.answer, item.bullets),
      },
    })),
    url,
  };
}