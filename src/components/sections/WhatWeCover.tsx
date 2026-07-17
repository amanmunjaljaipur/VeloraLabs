"use client";

import { MotionStagger, MotionStaggerItem } from "@/components/ui/MotionReveal";
import { WHAT_WE_COVER } from "@/lib/home-content";

interface WhatWeCoverProps {
  topics?: string[];
}
import { motion } from "framer-motion";

export function WhatWeCover({ topics = WHAT_WE_COVER }: WhatWeCoverProps) {
  return (
    <section className="border-b border-border bg-[var(--bg-parchment)] py-8 md:py-10">
      <div className="container-verlin">
        <p className="mb-5 text-center text-xs font-medium uppercase tracking-[0.08em] text-text-muted">
          What we cover
        </p>
        <MotionStagger className="flex flex-wrap items-center justify-center gap-2.5" stagger={0.04}>
          {topics.map((topic) => (
            <MotionStaggerItem key={topic}>
              <motion.span
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="inline-block cursor-default rounded-full border border-border bg-[var(--surface-card)] px-4 py-2 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-teal/35 hover:text-teal"
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