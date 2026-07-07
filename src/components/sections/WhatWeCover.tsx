"use client";

import { MotionStagger, MotionStaggerItem } from "@/components/ui/MotionReveal";
import { WHAT_WE_COVER } from "@/lib/home-content";

interface WhatWeCoverProps {
  topics?: string[];
}
import { motion } from "framer-motion";

export function WhatWeCover({ topics = WHAT_WE_COVER }: WhatWeCoverProps) {
  return (
    <section className="border-b border-border/80 bg-gradient-to-b from-muted/30 to-background py-10 md:py-12">
      <div className="container-verlin">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-text-muted">
          What we cover
        </p>
        <MotionStagger className="flex flex-wrap items-center justify-center gap-2.5" stagger={0.05}>
          {topics.map((topic) => (
            <MotionStaggerItem key={topic}>
              <motion.span
                whileHover={{ scale: 1.03, y: -1 }}
                transition={{ duration: 0.2 }}
                className="inline-block cursor-default rounded-full border border-border/80 bg-card/80 px-4 py-2 text-sm font-medium text-text-secondary shadow-xs transition-colors duration-200 hover:border-accent-teal/30 hover:bg-accent-teal/5 hover:text-teal hover:shadow-sm"
              >
                {topic}
              </motion.span>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}