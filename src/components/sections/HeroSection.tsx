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

/**
 * Controlled merge hero:
 * Prod conversion = dark navy split + full-width amber CTA
 * Hybrid polish = serif display, pill buttons, calm chips
 */
export function HeroSection({ hero = HOME_HERO }: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const [brand, headlineRest] = hero.headline.includes(" — ")
    ? hero.headline.split(" — ", 2)
    : [hero.headline, ""];

  return (
    <section className="overflow-hidden bg-[#0a1628]">
      <div className="grid lg:min-h-[min(86vh,800px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="relative z-20 flex items-center bg-[#0a1628] px-4 py-14 sm:px-6 md:py-16 lg:px-10 lg:py-20 xl:px-12">
          <motion.div
            className="mx-auto w-full max-w-2xl lg:mx-0"
            initial={reduceMotion ? false : { y: 16 }}
            animate={reduceMotion ? undefined : { y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-accent-teal" aria-hidden />
              Clarity-first learning · Verlin Labs
            </div>

            <h1 className="max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.125rem,5.2vw,3.75rem)] font-medium leading-[1.08] tracking-tight text-white">
              <span className="text-sky-300">{brand}</span>
              {headlineRest ? (
                <span className="text-white">{` — ${headlineRest}`}</span>
              ) : null}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 md:mt-6 md:text-lg">
              {hero.subheadline}
            </p>

            <div className="mt-6 flex flex-wrap gap-2 md:mt-7">
              {trustStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm"
                >
                  <span className="font-semibold text-white">{stat.value}</span>
                  <span className="mx-1.5 text-white/50">·</span>
                  <span className="text-white/70">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Prod conversion stack: primary CTA full-width, then secondary pair */}
            <div className="mx-auto mt-8 w-full max-w-xl md:mt-10">
              <ButtonLink
                href="/free-session"
                variant="cta"
                size="lg"
                className="w-full justify-center"
                fullWidth
              >
                Start Free 2-Hour Session
              </ButtonLink>
              <p className="mt-2.5 text-center text-xs text-white/55">
                No commitment · Book in 2 minutes
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ButtonLink
                  href="/courses"
                  variant="secondary"
                  size="lg"
                  delay={0.1}
                  fullWidth
                  className="w-full justify-center border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/15 hover:text-white"
                >
                  View Courses <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink
                  href="/library"
                  variant="secondary"
                  size="lg"
                  delay={0.14}
                  fullWidth
                  className="w-full justify-center border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/15 hover:text-white"
                >
                  Explore Library
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        </div>

        <div
          className="relative hidden min-h-[320px] overflow-hidden bg-[#0a1628] lg:block"
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
          <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0a1628] to-transparent" />
        </div>
      </div>
    </section>
  );
}
