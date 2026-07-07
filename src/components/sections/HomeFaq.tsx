import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import type { AccordionItem } from "@/components/ui/Accordion";
import { HOME_FAQS } from "@/lib/home-content";
import Link from "next/link";

interface HomeFaqProps {
  items?: AccordionItem[];
}

export function HomeFaq({ items = HOME_FAQS }: HomeFaqProps) {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-semibold text-center text-foreground">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-center text-text-secondary">
          Straight answers about the free session, mental models, and what makes Verlin Labs different.
        </p>
        <div className="mt-10">
          <Accordion items={items} defaultOpenIndex={0} />
        </div>
        <div className="mt-8 text-center">
          <Link href="/faq">
            <Button variant="secondary">View all FAQs</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}