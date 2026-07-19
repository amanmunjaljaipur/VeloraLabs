"use client";

import { MediaFrame } from "@/components/ui/MediaFrame";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { FREE_SESSION_ILLUSTRATION } from "@/lib/home-content";
import { EASE_OUT } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";

interface FreeSessionHeroProps {
  headline: string;
  description: string;
}

/** Text left + media right (original structure). */
export function FreeSessionHero({ headline, description }: FreeSessionHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border bg-[var(--canvas)]">
      <div className="container-verlin relative py-14 md:py-20">
        <div className="grid-editorial items-center lg:grid-cols-2 lg:gap-16">
          <motion.div
            className="w-full max-w-xl text-left"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            <p className="section-eyebrow">Free introductory session</p>
            <h1 className="text-display mt-4 font-medium">{headline}</h1>
            <p className="mt-5 text-base leading-relaxed text-text-secondary md:text-lg">
              {description}
            </p>
            <div className="mt-8 w-full max-w-full sm:w-fit">
              <p className="text-center text-sm text-text-muted">
                100% free · 2 hours live · No credit card · Easy reschedule
              </p>
              <div className="mt-4">
                <ButtonLink
                  href="#book"
                  size="lg"
                  variant="cta"
                  className="justify-center sm:min-w-[16rem]"
                >
                  Book your session now
                </ButtonLink>
              </div>
              <p className="mt-3 text-center text-xs text-text-muted">
                Book in about two minutes
              </p>
            </div>
          </motion.div>

          <motion.div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: EASE_OUT }}
          >
            <MediaFrame
              image={FREE_SESSION_ILLUSTRATION.src}
              alt={FREE_SESSION_ILLUSTRATION.alt}
              video={FREE_SESSION_ILLUSTRATION.video}
              priority
              rounded={false}
              scrim="none"
              sharpText
              className="absolute inset-0 min-h-0"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute bottom-4 left-4 z-10 rounded-2xl border border-cta-amber/30 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
              <p className="text-xl font-bold text-cta-amber">Free</p>
              <p className="text-xs font-medium text-text-secondary">
                No credit card required
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
