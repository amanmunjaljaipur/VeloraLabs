"use client";

import { TestimonialCard } from "@/components/sections/TestimonialCard";
import type { Testimonial } from "@/lib/content";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.children[0]?.clientWidth || 0;
    const gap = 24;
    scrollRef.current.scrollTo({
      left: index * (cardWidth + gap),
      behavior: "smooth",
    });
    setActive(index);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % testimonials.length;
        scrollToIndex(next);
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length, scrollToIndex]);

  return (
    <div>
      <div
        ref={scrollRef}
        className="-mx-4 flex gap-6 overflow-x-auto px-4 pb-4 scrollbar-hide snap-x snap-mandatory md:mx-0 md:px-0"
      >
        {testimonials.map((t) => (
          <div key={t.id} className="w-[85vw] shrink-0 snap-center sm:w-[400px]">
            <TestimonialCard {...t} />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to testimonial ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            onClick={() => scrollToIndex(i)}
            className="rounded-full p-1 transition-colors"
          >
            <motion.span
              layout
              className={`block h-2 rounded-full ${
                i === active ? "bg-accent-teal" : "bg-border hover:bg-accent-teal/40"
              }`}
              animate={{ width: i === active ? 24 : 8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}