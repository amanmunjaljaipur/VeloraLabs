"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { HOME_HERO } from "@/lib/home-content";
import { EASE_OUT } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, BookOpen, Sparkles, Users } from "lucide-react";

const trustStats = [
  { label: "Live sessions", value: "2 hr free" },
  { label: "Learner tracks", value: "3 paths" },
  { label: "Approach", value: "Clarity-first" },
];

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-hero-mesh">
      <div className="pattern-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="hero-orb hero-orb-teal -left-24 top-20 h-72 w-72" aria-hidden="true" />
      <div className="hero-orb hero-orb-amber right-0 top-1/3 h-64 w-64" aria-hidden="true" />
      <div className="hero-orb hero-orb-navy bottom-0 left-1/3 h-80 w-80" aria-hidden="true" />

      <div className="container-verlin relative py-14 md:py-24 lg:py-28">
        <div className="grid gap-10 md:gap-12 lg:grid-cols-2 lg:items-center lg:gap-14">
          <motion.div
            className="max-w-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-teal/20 bg-card/70 surface-glass px-4 py-2 text-sm text-text-secondary shadow-sm"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: EASE_OUT }}
            >
              <Sparkles className="h-4 w-4 text-accent-teal" />
              Clarity-first learning · Verlin Labs
            </motion.div>

            <h1 className="text-display font-semibold">
              Clarity-first learning for the{" "}
              <span className="text-gradient-teal">AI age</span>
            </h1>

            <p className="text-body-lead mt-5 md:mt-6">{HOME_HERO.subheadline}</p>

            <div className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
              {trustStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.35, ease: EASE_OUT }}
                  className="rounded-xl border border-border/80 bg-card/60 px-3 py-2 text-xs backdrop-blur-sm"
                >
                  <span className="font-semibold text-foreground">{stat.value}</span>
                  <span className="mx-1.5 text-text-muted">·</span>
                  <span className="text-text-secondary">{stat.label}</span>
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
                <p className="mt-2 text-center text-xs text-text-muted sm:text-left">
                  No commitment · Book in 2 minutes
                </p>
              </div>
              <ButtonLink
                href="/courses"
                variant="secondary"
                size="lg"
                delay={0.12}
                className="w-full"
              >
                View Courses <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href="/library"
                variant="secondary"
                size="lg"
                delay={0.15}
                className="w-full"
              >
                Explore the Library <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT }}
          >
            <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-accent-teal/15 bg-gradient-to-br from-accent-teal/5 via-background to-sky-100/30 shadow-glow-teal">
              <Image
                src={HOME_HERO.illustration}
                alt={HOME_HERO.illustrationAlt}
                fill
                className="object-contain p-4 md:p-6"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            <motion.div
              className="absolute -bottom-4 -left-4 hidden animate-float-subtle rounded-2xl border border-border bg-card p-4 shadow-lg surface-glass sm:block"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4, ease: EASE_OUT }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-teal/15 text-accent-teal">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Mental models</p>
                  <p className="text-xs text-text-secondary">Frameworks that stick</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -right-3 top-6 hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-lg surface-glass sm:block"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4, ease: EASE_OUT }}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent-teal" />
                <p className="text-sm font-medium text-foreground">Students · Engineers · PMs</p>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-6 right-6 hidden rounded-2xl border border-cta-amber/25 bg-card/90 px-5 py-3 shadow-lg surface-glass backdrop-blur-sm sm:block"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.35, ease: EASE_OUT }}
            >
              <p className="text-2xl font-bold text-cta-amber">Free</p>
              <p className="text-xs font-medium text-text-secondary">2-hour intro · No card</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}