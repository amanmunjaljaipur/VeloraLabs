"use client";

import { Button } from "@/components/ui/Button";
import { HOME_HERO } from "@/lib/home-content";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 lg:hidden">
        <Image
          src="/images/ai-learning.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 backdrop-blur-sm px-4 py-1.5 text-sm text-text-secondary">
              <Sparkles className="h-4 w-4 text-accent-teal" />
              Free 2-hour sessions · Live teaching
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-foreground">
              {HOME_HERO.headline}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-text-secondary leading-relaxed">
              {HOME_HERO.subheadline}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/free-session">
                <Button size="lg" className="w-full sm:w-auto">
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
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-2xl">
              <Image
                src="/images/ai-learning.jpg"
                alt="Person experiencing clarity as complex neural patterns simplify into clean glowing structures"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-deep-teal/25 via-transparent to-accent-teal/10" />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl border border-border bg-card p-4 shadow-lg backdrop-blur-sm">
              <p className="text-2xl font-semibold text-teal">2 hours</p>
              <p className="text-xs text-text-secondary">Free intro · No commitment</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}