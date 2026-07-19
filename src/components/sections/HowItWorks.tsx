"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { MotionStagger, MotionStaggerItem } from "@/components/ui/MotionReveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import type { HomeContentData } from "@/lib/cms/home-content-types";
import { HOW_IT_WORKS, HOW_IT_WORKS_ILLUSTRATION } from "@/lib/home-content";
import { BRAND_MEDIA } from "@/lib/brand-media";
import { DURATION, EASE_OUT, HOVER } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import { Brain, CalendarCheck, Rocket, Wrench } from "lucide-react";

const icons = {
  calendar: CalendarCheck,
  brain: Brain,
  wrench: Wrench,
  rocket: Rocket,
};

interface HowItWorksProps {
  steps?: readonly HomeContentData["howItWorks"][number][];
  illustration?: HomeContentData["howItWorksIllustration"] & { video?: string };
}

export function HowItWorks({
  steps = HOW_IT_WORKS,
  illustration = HOW_IT_WORKS_ILLUSTRATION,
}: HowItWorksProps) {
  const reduceMotion = useReducedMotion();
  const video =
    ("video" in illustration ? illustration.video : undefined) ??
    BRAND_MEDIA.homeJourney.video;

  return (
    <section
      id="how-it-works"
      className="section-y relative scroll-mt-20 bg-[var(--bg-light)]"
    >
      <div className="container-verlin relative">
        <div className="stack-header">
          <SectionHeader
            eyebrow="Your journey"
            title="How it works"
            subtitle="From free session to demo day - four clear steps."
          />
        </div>

        <motion.div
          className="relative mb-[var(--stack-gap)] overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-md)]"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
        >
          <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
            <MediaFrame
              image={illustration.src}
              alt={illustration.alt}
              video={video}
              rounded={false}
              scrim="none"
              sharpText
              className="absolute inset-0 min-h-0"
              sizes="(max-width: 1280px) 100vw, 1152px"
            />
          </div>
        </motion.div>

        <MotionStagger
          className="grid-editorial sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.08}
        >
          {steps.map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            return (
              <MotionStaggerItem key={item.step}>
                <motion.div className="card-verlin h-full p-5 text-left md:p-6">
                  <motion.div
                    whileHover={
                      reduceMotion
                        ? undefined
                        : {
                            scale: HOVER.iconScale,
                            transition: {
                              duration: DURATION.hover,
                              ease: EASE_OUT,
                            },
                          }
                    }
                    className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent-teal/10"
                  >
                    <Icon className="h-5 w-5 text-teal" aria-hidden="true" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[10px] font-semibold text-white">
                      {item.step}
                    </span>
                  </motion.div>
                  <h3 className="card-title mt-5">{item.title}</h3>
                  <p className="card-body mt-2">{item.description}</p>
                </motion.div>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </div>
    </section>
  );
}
