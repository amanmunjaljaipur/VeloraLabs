"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

export interface AccordionItem {
  question: string;
  answer: string;
  bullets?: string[];
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenIndex?: number | null;
  allowMultiple?: boolean;
}

export function Accordion({
  items,
  defaultOpenIndex = 0,
  allowMultiple = false,
}: AccordionProps) {
  const baseId = useId();
  const [openIndices, setOpenIndices] = useState<Set<number>>(() => {
    if (defaultOpenIndex === null || defaultOpenIndex === undefined) return new Set();
    return new Set([defaultOpenIndex]);
  });

  const toggle = (index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        return next;
      }
      if (!allowMultiple) {
        return new Set([index]);
      }
      next.add(index);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndices.has(index);
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div
            key={item.question}
            className={cn(
              "overflow-hidden rounded-2xl border bg-card transition-colors duration-200",
              isOpen ? "border-teal/25 shadow-sm" : "border-border"
            )}
          >
            <button
              id={buttonId}
              type="button"
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 md:px-6 md:py-5"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="font-medium text-foreground">{item.question}</span>
              <ChevronDown
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0 text-teal transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-all duration-200 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-4 border-t border-border/60 px-5 pb-5 pt-4 text-sm leading-relaxed text-text-secondary md:px-6">
                  {item.answer.split("\n\n").map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))}
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="space-y-2 pl-1">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}