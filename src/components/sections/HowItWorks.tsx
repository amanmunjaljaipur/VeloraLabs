"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { MotionStagger, MotionStaggerItem } from "@/components/ui/MotionReveal";
import type { HomeContentData } from "@/lib/cms/home-content-types";
import { HOW_IT_WORKS, HOW_IT_WORKS_ILLUSTRATION } from "@/lib/home-content";
import { DURATION, EASE_OUT, HOVER } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import { Brain, CalendarCheck, Rocket, Wrench } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const icons = {
  calendar: CalendarCheck,
  brain: Brain,
  wrench: Wrench,
  rocket: Rocket,
};

interface HowItWorksProps {
  steps?: readonly HomeContentData["howItWorks"][number][];
  illustration?: HomeContentData["howItWorksIllustration"];
}

export function HowItWorks({
  steps = HOW_IT_WORKS,
  illustration = HOW_IT_WORKS_ILLUSTRATION,
}: HowItWorksProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="section-y relative scroll-mt-20 overflow-hidden bg-[var(--bg-light)]">
      <div className="container-verlin relative">
        <SectionHeader
          eyebrow="Your journey"
          title="How it works"
          subtitle="From free session to demo day — four clear steps."
          className="mb-10 md:mb-14"
        />

        <motion.div
          className="relative mb-14 overflow-hidden rounded-xl border border-border bg-[var(--surface-dark)] shadow-[var(--shadow-product)]"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
        >
          <div className="relative aspect-[16/9] w-full md:aspect-[16/8]">
            <OptimizedImage
              src={illustration.src}
              alt={illustration.alt}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
        </motion.div>

        <MotionStagger className="relative grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4" stagger={0.1}>
          {steps.map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            return (
              <MotionStaggerItem key={item.step}>
                <motion.div
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { y: HOVER.cardLift, transition: { duration: 0.25, ease: EASE_OUT } }
                  }
                  className="card-verlin h-full p-5 text-center md:p-6"
                >
                  <motion.div
                    whileHover={
                      reduceMotion
                        ? undefined
                        : { scale: HOVER.iconScale, transition: { duration: DURATION.hover, ease: EASE_OUT } }
                    }
                    className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-teal/10"
                  >
                    <Icon className="h-5 w-5 text-teal" aria-hidden="true" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[10px] font-semibold text-white">
                      {item.step}
                    </span>
                  </motion.div>
                  <h3 className="mt-5 font-[family-name:var(--font-display)] text-lg font-medium tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.description}</p>
                </motion.div>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </div>
    </section>
  );
}