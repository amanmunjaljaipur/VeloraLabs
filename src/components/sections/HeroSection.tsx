"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { HOME_HERO } from "@/lib/home-content";
import { EASE_OUT } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

const trustStats = [
  { label: "Live sessions", value: "2 hr free" },
  { label: "Learner tracks", value: "3 paths" },
  { label: "Approach", value: "Clarity-first" },
];

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="overflow-hidden bg-[#0a1628]">
      <div className="grid min-h-[min(88vh,820px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Copy column — solid background only, no hero image behind text */}
        <div className="relative z-10 flex items-center px-4 py-14 sm:px-6 md:py-16 lg:px-8 lg:py-20 xl:px-12">
          <motion.div
            className="mx-auto w-full max-w-2xl lg:mx-0"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: EASE_OUT }}
            >
              <Sparkles className="h-4 w-4 text-accent-teal" />
              Clarity-first learning · Verlin Labs
            </motion.div>

            <h1 className="text-display font-semibold leading-[1.08] text-white">
              Clarity-first learning for the{" "}
              <span className="text-sky-300">AI age</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/90 md:mt-6 md:text-xl">
              {HOME_HERO.subheadline}
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
              {trustStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.35, ease: EASE_OUT }}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs backdrop-blur-sm"
                >
                  <span className="font-semibold text-white">{stat.value}</span>
                  <span className="mx-1.5 text-white/45">·</span>
                  <span className="text-white/80">{stat.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start md:mt-10">
              <div className="flex w-full flex-col sm:w-auto">
                <ButtonLink
                  href="/free-session"
                  variant="cta"
                  size="lg"
                  className="w-full shadow-glow-amber"
                >
                  Start Free 2-Hour Session
                </ButtonLink>
                <p className="mt-2 text-center text-xs text-white/55 sm:text-left">
                  No commitment · Book in 2 minutes
                </p>
              </div>
              <ButtonLink
                href="/courses"
                variant="secondary"
                size="lg"
                delay={0.12}
                className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white sm:w-auto"
              >
                View Courses <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href="/library"
                variant="secondary"
                size="lg"
                delay={0.15}
                className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white sm:w-auto"
              >
                Explore the Library <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </motion.div>
        </div>

        {/* Visual column — cropped to neural graphic only (hides baked-in image text) */}
        <div className="relative min-h-[240px] sm:min-h-[300px] lg:min-h-full">
          <Image
            src={HOME_HERO.illustration}
            alt={HOME_HERO.illustrationAlt}
            fill
            priority
            className="scale-110 object-cover object-[92%_center] lg:scale-100 lg:object-[80%_center]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0a1628] from-35% via-[#0a1628]/55 to-transparent lg:from-25% lg:via-[#0a1628]/30"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/60 via-transparent to-[#0d1f3a]/20 lg:hidden"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}