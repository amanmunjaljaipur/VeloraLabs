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
    <section id="how-it-works" className="section-y section-divider relative scroll-mt-20 overflow-hidden bg-muted/25">
      <div className="hero-orb hero-orb-teal -left-32 top-1/2 h-64 w-64 opacity-60" aria-hidden="true" />
      <div className="container-verlin relative">
        <SectionHeader
          eyebrow="Your journey"
          title="How it works"
          subtitle="From free session to demo day — four clear steps."
          className="mb-10 md:mb-14"
        />

        <motion.div
          className="relative mb-14 overflow-hidden rounded-3xl border border-accent-teal/15 bg-gradient-to-br from-accent-teal/5 via-background to-sky-50/30 shadow-sm"
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
                  className="card-verlin h-full rounded-2xl border border-border/80 bg-card p-5 text-center shadow-sm transition-shadow duration-[250ms] hover:border-accent-teal/25 hover:shadow-lg md:p-6"
                >
                  <motion.div
                    whileHover={
                      reduceMotion
                        ? undefined
                        : { scale: HOVER.iconScale, transition: { duration: DURATION.hover, ease: EASE_OUT } }
                    }
                    className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-teal/30 bg-gradient-to-br from-accent-teal/15 via-card to-transparent shadow-sm"
                  >
                    <Icon className="h-6 w-6 text-accent-teal" aria-hidden="true" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs font-bold text-white shadow-md">
                      {item.step}
                    </span>
                  </motion.div>
                  <h3 className="mt-5 text-base font-bold text-foreground md:text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-snug text-text-secondary md:leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </div>
    </section>
  );
}