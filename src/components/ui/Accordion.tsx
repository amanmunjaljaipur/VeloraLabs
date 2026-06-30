"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface AccordionItem {
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <button
              className="flex w-full items-center justify-between px-6 py-5 text-left font-medium text-foreground transition-colors hover:bg-muted/50"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
            >
              {item.question}
              <ChevronDown
                className={cn("h-5 w-5 shrink-0 text-text-secondary transition-transform", isOpen && "rotate-180")}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-96" : "max-h-0"
              )}
            >
              <p className="px-6 pb-5 text-text-secondary leading-relaxed">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}