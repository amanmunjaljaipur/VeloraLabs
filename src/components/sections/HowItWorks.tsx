"use client";

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
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">How it works</h2>
          <p className="mt-4 text-text-secondary leading-relaxed">
            A clear path from your first free session to building something you can show.
          </p>
        </div>

        <div className="relative mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div
            className="absolute top-10 left-[12%] right-[12%] hidden h-px bg-border lg:block"
            aria-hidden="true"
          />
          {HOW_IT_WORKS.map((item, index) => {
            const Icon = icons[item.icon];
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="relative text-center"
              >
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal/20 bg-card shadow-sm">
                  <Icon className="h-6 w-6 text-teal" aria-hidden="true" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-deep-teal text-xs font-semibold text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-5 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}