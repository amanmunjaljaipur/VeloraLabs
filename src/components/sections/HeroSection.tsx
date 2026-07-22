"use client";

import { MediaFrame } from "@/components/ui/MediaFrame";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { VerlinBrandText } from "@/components/ui/VerlinBrandText";
import type { HomeContentData } from "@/lib/cms/home-content-types";
import { HOME_HERO } from "@/lib/home-content";
import { BRAND_MEDIA } from "@/lib/brand-media";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";

interface HeroSectionProps {
  hero?: HomeContentData["hero"];
}

/**
 * Side-by-side hero. CTA cluster is width-fit so lines above/below
 * center to the button pair (not the full text column).
 */
export function HeroSection({ hero = HOME_HERO }: HeroSectionProps) {
  const reduceMotion = useReducedMotion();

  const brandPrefix = /^Verlin Labs/i;
  const hasBrand = brandPrefix.test(hero.headline);
  const afterBrand = hasBrand ? hero.headline.replace(brandPrefix, "") : hero.headline;

  // Prefer brand media defaults if CMS omits video (common CMS draft gap)
  const poster = hero.illustration || BRAND_MEDIA.homeHero.image;
  const video =
    (typeof hero.video === "string" && hero.video.trim()) ||
    BRAND_MEDIA.homeHero.video ||
    "/videos/hero-neural.mp4";
  const alt = hero.illustrationAlt || BRAND_MEDIA.homeHero.alt;

  return (
    <section className="hero-dark relative overflow-hidden bg-[var(--surface-dark)]">
      {/* Ambient drifting glow - premium atmosphere behind the hero copy. Screen blend so the
          teal/amber actually pops against the dark surface instead of just tinting it darker. */}
      <div
        className="hero-orb hero-orb-teal animate-orb-drift-a pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] opacity-70 mix-blend-screen"
        aria-hidden="true"
      />
      <div
        className="hero-orb hero-orb-amber animate-orb-drift-b pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 opacity-50 mix-blend-screen"
        aria-hidden="true"
      />
      <div className="relative grid lg:min-h-[min(86vh,800px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="relative z-20 flex items-center py-14 md:py-16 lg:py-20">
          <div className="container-verlin w-full">
            <motion.div
              className="w-full max-w-xl text-left"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
            >
              <p className="section-eyebrow section-eyebrow--on-dark">
                Clarity-first AI training
              </p>

              <h1 className="text-display mt-5 text-white">
                {hasBrand ? (
                  <VerlinBrandText
                    tone="light"
                    after={afterBrand}
                    afterClassName="text-white"
                  />
                ) : (
                  hero.headline
                )}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/88 md:mt-6 md:text-lg">
                {hero.subheadline}
              </p>

              {/*
                w-fit + text-center: helper lines center to the button group width,
                not the full column (matches OpenAI-style CTA clusters).
              */}
              <div className="mt-8 w-full max-w-full sm:w-fit">
                <p className="text-center text-sm text-white/55">
                  Free 2-hour session · Three tracks · Clarity-first teaching
                </p>

                <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                  <ButtonLink
                    href="/free-session"
                    variant="cta"
                    size="lg"
                    className="justify-center sm:min-w-[15rem]"
                  >
                    Start free 2-hour session
                  </ButtonLink>
                  <ButtonLink
                    href="/courses"
                    variant="secondary"
                    size="lg"
                    className="justify-center border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/15 hover:text-white sm:min-w-[10rem]"
                  >
                    View courses
                  </ButtonLink>
                </div>

                <p className="mt-3 text-center text-xs text-white/45">
                  No commitment · Book in about two minutes
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative hidden min-h-[360px] lg:block">
          <MediaFrame
            image={poster}
            alt={alt}
            video={video}
            priority
            rounded={false}
            scrim="none"
            sharpText
            className="absolute inset-0 h-full min-h-0 w-full"
            sizes="(min-width: 1024px) 50vw, 0px"
          />
          {/* Thin blend only - do not haze video type */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[var(--surface-dark)]/80 to-transparent"
            aria-hidden
          />
        </div>
      </div>

      <div className="relative border-t border-white/10 lg:hidden">
        <div className="relative aspect-[16/10] w-full">
          <MediaFrame
            image={poster}
            alt={alt}
            video={video}
            priority
            rounded={false}
            scrim="none"
            sharpText
            className="absolute inset-0 min-h-0"
            sizes="100vw"
          />
        </div>
      </div>
    </section>
  );
}
