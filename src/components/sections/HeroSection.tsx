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
    <section className="relative min-h-[min(92vh,860px)] overflow-hidden bg-[#0a1628]">
      <Image
        src={HOME_HERO.illustration}
        alt=""
        fill
        priority
        className="object-cover object-[72%_center] md:object-[68%_center]"
        sizes="100vw"
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0a1628]/92 to-[#0a1628]/15 md:via-[#0a1628]/88 md:to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/80 via-transparent to-[#0d1f3a]/30"
        aria-hidden="true"
      />

      <div className="container-verlin relative flex min-h-[min(92vh,860px)] items-center py-16 md:py-20 lg:py-24">
        <motion.div
          className="relative z-10 max-w-2xl"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-sm"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: EASE_OUT }}
          >
            <Sparkles className="h-4 w-4 text-accent-teal" />
            Clarity-first learning · Verlin Labs
          </motion.div>

          <h1 className="text-display font-semibold leading-[1.08] text-white">
            Clarity-first learning for the{" "}
            <span className="bg-gradient-to-r from-accent-teal to-sky-300 bg-clip-text text-transparent">
              AI age
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85 md:mt-6 md:text-xl">
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
                <span className="text-white/75">{stat.label}</span>
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
    </section>
  );
}