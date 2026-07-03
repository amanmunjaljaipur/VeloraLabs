"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { FREE_SESSION_ILLUSTRATION } from "@/lib/home-content";
import { EASE_OUT } from "@/lib/motion";
import { CalendarCheck, Clock, ShieldCheck, Video } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

interface FreeSessionHeroProps {
  headline: string;
  description: string;
}

const trustItems = [
  { icon: ShieldCheck, label: "100% free" },
  { icon: Clock, label: "2 hours" },
  { icon: Video, label: "Live online" },
  { icon: CalendarCheck, label: "Easy reschedule" },
];

export function FreeSessionHero({ headline, description }: FreeSessionHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border/80 bg-hero-mesh">
      <div className="pattern-grid absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="hero-orb hero-orb-teal -left-24 top-16 h-64 w-64" aria-hidden="true" />
      <div className="hero-orb hero-orb-amber right-0 top-1/3 h-56 w-56" aria-hidden="true" />

      <div className="container-verlin relative py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            className="max-w-xl"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <p className="section-eyebrow mb-4">Free introductory session</p>
            <h1 className="text-display font-semibold">{headline}</h1>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">{description}</p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {trustItems.map(({ icon: Icon, label }, i) => (
                <motion.span
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3.5 py-2 text-sm text-text-secondary shadow-xs backdrop-blur-sm"
                >
                  <Icon className="h-4 w-4 text-accent-teal" />
                  {label}
                </motion.span>
              ))}
            </div>
            <div className="mt-10">
              <ButtonLink href="#book" size="lg" variant="cta" className="shadow-glow-amber">
                Book your session now
              </ButtonLink>
              <p className="mt-2 text-xs text-text-muted">100% free · No credit card</p>
            </div>
          </motion.div>

          <motion.div
            className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-accent-teal/15 bg-gradient-to-br from-accent-teal/5 via-background to-sky-50/30 shadow-glow-teal lg:block"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <Image
              src={FREE_SESSION_ILLUSTRATION.src}
              alt={FREE_SESSION_ILLUSTRATION.alt}
              fill
              className="object-contain p-4 md:p-6"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute bottom-5 left-5 rounded-2xl border border-cta-amber/25 bg-card/90 px-4 py-3 shadow-lg surface-glass backdrop-blur-sm">
              <p className="text-xl font-bold text-cta-amber">Free</p>
              <p className="text-xs font-medium text-text-secondary">No credit card required</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}