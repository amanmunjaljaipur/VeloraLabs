"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { HOW_IT_WORKS, HOW_IT_WORKS_ILLUSTRATION } from "@/lib/home-content";
import { motion } from "framer-motion";
import { Brain, CalendarCheck, Rocket, Wrench } from "lucide-react";
import Image from "next/image";

const icons = {
  calendar: CalendarCheck,
  brain: Brain,
  wrench: Wrench,
  rocket: Rocket,
};

export function HowItWorks() {
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
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative aspect-[16/7] w-full md:aspect-[16/6]">
            <Image
              src={HOW_IT_WORKS_ILLUSTRATION.src}
              alt={HOW_IT_WORKS_ILLUSTRATION.alt}
              fill
              className="object-contain p-4 md:p-8"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
        </motion.div>

        <div className="relative grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, index) => {
            const Icon = icons[item.icon];
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="card-verlin card-verlin-hover relative rounded-2xl border border-border/80 bg-card p-5 text-center shadow-sm md:p-6"
              >
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-teal/30 bg-gradient-to-br from-accent-teal/15 via-card to-transparent shadow-sm">
                  <Icon className="h-6 w-6 text-accent-teal" aria-hidden="true" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs font-bold text-white shadow-md">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-bold text-foreground md:text-lg">{item.title}</h3>
                <p className="mt-2 text-sm leading-snug text-text-secondary md:leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}