"use client";

import { Button } from "@/components/ui/Button";
import { HOME_HERO } from "@/lib/home-content";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Users } from "lucide-react";

const trustStats = [
  { label: "Live sessions", value: "2 hr free" },
  { label: "Learner tracks", value: "3 paths" },
  { label: "Approach", value: "Clarity-first" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-hero-mesh">
      <div className="pattern-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="hero-orb hero-orb-teal -left-24 top-20 h-72 w-72" aria-hidden="true" />
      <div className="hero-orb hero-orb-amber right-0 top-1/3 h-64 w-64" aria-hidden="true" />
      <div className="hero-orb hero-orb-navy bottom-0 left-1/3 h-80 w-80" aria-hidden="true" />

      <div className="absolute inset-0 lg:hidden">
        <Image
          src="/images/hero-premium.jpg"
          alt=""
          fill
          className="object-cover opacity-30"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/92 via-background/88 to-background" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-teal/20 bg-card/70 surface-glass px-4 py-2 text-sm text-text-secondary shadow-sm"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <Sparkles className="h-4 w-4 text-accent-teal" />
              Premium clarity-first learning · Verlin Labs
            </motion.div>

            <h1 className="text-display font-semibold">
              Clarity-first learning for the{" "}
              <span className="text-gradient-teal">AI age</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-text-secondary md:text-xl md:leading-relaxed">
              {HOME_HERO.subheadline}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {trustStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.06 }}
                  className="rounded-xl border border-border/80 bg-card/60 px-3 py-2 text-xs backdrop-blur-sm"
                >
                  <span className="font-semibold text-foreground">{stat.value}</span>
                  <span className="mx-1.5 text-text-muted">·</span>
                  <span className="text-text-secondary">{stat.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/free-session">
                <Button variant="cta" size="lg" className="w-full shadow-glow-amber sm:w-auto">
                  Start Free 2-Hour Session
                </Button>
              </Link>
              <Link href="/library">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Explore the Library <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-border/80 shadow-glow-teal surface-elevated">
              <Image
                src="/images/hero-premium.jpg"
                alt="Learner experiencing clarity in a modern AI learning environment"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-navy/30 via-transparent to-accent-teal/15" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            </div>

            <motion.div
              className="absolute -bottom-5 -left-6 animate-float-subtle rounded-2xl border border-border bg-card p-4 shadow-lg surface-glass"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
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
              className="absolute -right-4 top-8 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg surface-glass"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent-teal" />
                <p className="text-sm font-medium text-foreground">Students · Engineers · PMs</p>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-8 right-8 rounded-2xl border border-cta-amber/30 bg-cta-amber-light px-5 py-3 shadow-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-2xl font-bold text-navy">Free</p>
              <p className="text-xs font-medium text-text-secondary">2-hour intro · No card</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}