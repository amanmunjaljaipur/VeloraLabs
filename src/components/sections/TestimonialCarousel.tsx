"use client";

import { TestimonialCard } from "@/components/sections/TestimonialCard";
import type { Testimonial } from "@/lib/content";
import { useEffect, useRef, useState } from "react";

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % testimonials.length;
        if (scrollRef.current) {
          const cardWidth = scrollRef.current.children[0]?.clientWidth || 0;
          const gap = 24;
          scrollRef.current.scrollTo({
            left: next * (cardWidth + gap),
            behavior: "smooth",
          });
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div>
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4 md:mx-0 md:px-0"
      >
        {testimonials.map((t) => (
          <div key={t.id} className="w-[85vw] sm:w-[400px] shrink-0 snap-center">
            <TestimonialCard {...t} />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to testimonial ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === active ? "w-6 bg-teal" : "w-2 bg-border"
            }`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}