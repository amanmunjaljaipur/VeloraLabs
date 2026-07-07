"use client";

import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { SITE_IMAGE_ALT } from "@/lib/image-alt";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import Link from "next/link";

export function ContactHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/80 bg-hero-mesh">
      <div className="pattern-grid absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="hero-orb hero-orb-teal -left-20 top-12 h-56 w-56" aria-hidden="true" />
      <div className="hero-orb hero-orb-navy bottom-0 right-1/4 h-64 w-64" aria-hidden="true" />

      <div className="container-verlin relative py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="section-eyebrow mb-4">Contact</p>
            <h1 className="text-display font-semibold">
              Let&apos;s talk about{" "}
              <span className="text-gradient-teal">clarity-first</span> learning
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
              Whether you&apos;re booking a session, exploring team programs, or pitching a
              partnership — we respond thoughtfully and without pressure.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#contact-form">
                <Button size="lg" variant="cta" className="w-full shadow-glow-amber sm:w-auto">
                  Send a message
                </Button>
              </Link>
              <Link href="/free-session">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Book free session
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl border border-border/80 shadow-lg surface-elevated lg:max-w-none"
            initial={{ x: 16 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <OptimizedImage
              src="/images/contact-hero.jpg"
              alt={SITE_IMAGE_ALT.contact}
              fill
              aboveFold
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-navy/30 via-transparent to-accent-teal/15" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}