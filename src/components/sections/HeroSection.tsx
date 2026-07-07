"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { HomeContentData } from "@/lib/cms/home-content-types";
import { HOME_HERO } from "@/lib/home-content";
import { EASE_OUT } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const trustStats = [
  { label: "Live sessions", value: "2 hr free" },
  { label: "Learner tracks", value: "3 paths" },
  { label: "Approach", value: "Clarity-first" },
];

interface HeroSectionProps {
  hero?: HomeContentData["hero"];
}

export function HeroSection({ hero = HOME_HERO }: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const [brand, headlineRest] = hero.headline.includes(" — ")
    ? hero.headline.split(" — ", 2)
    : [hero.headline, ""];

  return (
    <section className="hero-dark overflow-hidden bg-[#0a1628]">
      <div className="grid lg:min-h-[min(88vh,820px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Copy — isolated from graphic column; no image bleed */}
        <div className="relative z-20 flex items-center bg-[#0a1628] px-4 py-14 sm:px-6 md:py-16 lg:px-8 lg:py-20 xl:px-12">
          <motion.div
            className="hero-dark mx-auto w-full max-w-2xl lg:mx-0"
            initial={reduceMotion ? false : { y: 20 }}
            animate={reduceMotion ? undefined : { y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm"
              style={{ color: "rgb(248 250 252 / 0.92)" }}
              initial={reduceMotion ? false : { scale: 0.98 }}
              animate={reduceMotion ? undefined : { scale: 1 }}
              transition={{ delay: 0.05, duration: 0.35, ease: EASE_OUT }}
            >
              <Sparkles className="h-4 w-4 text-accent-teal" />
              Clarity-first learning · Verlin Labs
            </motion.div>

            <h1
              className="max-w-xl text-[clamp(2.125rem,5.5vw,4rem)] font-extrabold leading-[1.08] tracking-tight"
              style={{ color: "#ffffff" }}
            >
              <span className="hero-headline-accent" style={{ color: "#7dd3fc" }}>
                {brand}
              </span>
              {headlineRest ? ` — ${headlineRest}` : null}
            </h1>

            <p className="hero-subtext mt-5 max-w-xl text-lg leading-relaxed md:mt-6 md:text-xl">
              {hero.subheadline}
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
              {trustStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={reduceMotion ? false : { y: 6 }}
                  animate={reduceMotion ? undefined : { y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.3, ease: EASE_OUT }}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs backdrop-blur-sm"
                >
                  <span className="font-semibold" style={{ color: "#ffffff" }}>
                    {stat.value}
                  </span>
                  <span className="mx-1.5 hero-muted">·</span>
                  <span className="hero-muted">{stat.label}</span>
                </motion.div>
              ))}
            </div>

            {/* CTAs — one aligned block: primary centered over secondary pair */}
            <div className="mx-auto mt-8 w-full max-w-xl md:mt-10">
              <ButtonLink
                href="/free-session"
                variant="cta"
                size="lg"
                className="w-full justify-center shadow-glow-amber"
                fullWidth
              >
                Start Free 2-Hour Session
              </ButtonLink>
              <p className="hero-muted mt-2.5 text-center text-xs">
                No commitment · Book in 2 minutes
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ButtonLink
                  href="/courses"
                  variant="secondary"
                  size="lg"
                  delay={0.12}
                  fullWidth
                  className="w-full justify-center border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  View Courses <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink
                  href="/library"
                  variant="secondary"
                  size="lg"
                  delay={0.15}
                  fullWidth
                  className="w-full justify-center border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  Explore Library <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Graphic-only asset (no baked-in headline text) */}
        <div
          className="relative hidden overflow-hidden bg-[#0a1628] lg:block"
          aria-hidden="true"
        >
          <OptimizedImage
            src={hero.illustration}
            alt={hero.illustrationAlt}
            fill
            aboveFold
            className="object-cover object-center"
            sizes="(min-width: 1024px) 50vw, 0px"
          />
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0a1628] to-transparent" />
        </div>
      </div>
    </section>
  );
}