"use client";

import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Mid-page conversion: text + unique still (no video).
 * Free-session video is reserved for the Free Session page only.
 */
export function CinematicCta() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="section-y relative overflow-hidden border-y border-border bg-[var(--surface-dark)]">
      <div
        className="hero-orb hero-orb-teal animate-orb-drift-b pointer-events-none absolute -right-20 top-1/2 h-96 w-96 -translate-y-1/2 opacity-60 mix-blend-screen"
        aria-hidden="true"
      />
      <div className="container-verlin relative">
        <div className="grid-editorial items-center lg:grid-cols-2 lg:gap-16">
          <motion.div
            className="w-full max-w-xl text-left"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
            transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
          >
            <p className="section-eyebrow section-eyebrow--on-dark">Free intro</p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.2vw,2.5rem)] font-medium tracking-tight text-white">
              Experience the <span className="text-gradient-flow">teaching</span> before you commit
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/85 md:text-lg">
              Two live hours. Mental models, hands-on exercises, and a path that
              matches your background. No pitch.
            </p>
            <div className="mt-8 w-full max-w-full sm:w-fit">
              <p className="text-center text-sm text-white/55">
                Free · Live online · No credit card
              </p>
              <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink
                  href="/free-session"
                  variant="cta"
                  size="lg"
                  className="justify-center sm:min-w-[14rem]"
                >
                  Book free session
                </ButtonLink>
                <ButtonLink
                  href="#free-session-form"
                  variant="secondary"
                  size="lg"
                  className="justify-center border-white/30 bg-white/10 text-white hover:bg-white/16 hover:text-white sm:min-w-[11rem]"
                >
                  Request a slot
                </ButtonLink>
              </div>
              <p className="mt-3 text-center text-xs text-white/45">
                Takes about two minutes
              </p>
            </div>
          </motion.div>

          <motion.div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 shadow-lg"
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
            transition={{ duration: DURATION.reveal, delay: 0.05, ease: EASE_OUT }}
          >
            <OptimizedImage
              src="/images/brand-free-session.jpg"
              alt="Calm free-session atmosphere"
              fill
              className="object-cover motion-safe:hero-ken-burns"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--surface-dark)]/40 via-transparent to-transparent" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
