"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { HOW_IT_WORKS } from "@/lib/home-content";
import { motion } from "framer-motion";
import { Brain, CalendarCheck, Rocket, Wrench } from "lucide-react";

const icons = {
  calendar: CalendarCheck,
  brain: Brain,
  wrench: Wrench,
  rocket: Rocket,
};

export function HowItWorks() {
  return (
    <section className="section-y relative overflow-hidden bg-muted/30">
      <div className="hero-orb hero-orb-teal -left-32 top-1/2 h-64 w-64 opacity-60" aria-hidden="true" />
      <div className="container-verlin relative">
        <SectionHeader
          eyebrow="Your journey"
          title="How it works"
          subtitle="A clear path from your first free session to building something you can show."
          className="mb-16"
        />

        <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div
            className="absolute top-[4.5rem] left-[8%] right-[8%] hidden h-px bg-gradient-to-r from-transparent via-accent-teal/50 to-transparent lg:block"
            aria-hidden="true"
          />
          {HOW_IT_WORKS.map((item, index) => {
            const Icon = icons[item.icon];
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card-verlin card-verlin-hover relative rounded-2xl border border-border/80 bg-card p-6 text-center shadow-sm"
              >
                <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-teal/30 bg-gradient-to-br from-accent-teal/15 via-card to-transparent shadow-sm">
                  <Icon className="h-7 w-7 text-accent-teal" aria-hidden="true" />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white shadow-md">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-6 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}