"use client";

import { Button } from "@/components/ui/Button";
import { CalendarCheck, Clock, ShieldCheck, Video } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

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
  return (
    <section className="relative overflow-hidden border-b border-border/80 bg-hero-mesh">
      <div className="pattern-grid absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="hero-orb hero-orb-teal -left-24 top-16 h-64 w-64" aria-hidden="true" />
      <div className="hero-orb hero-orb-amber right-0 top-1/3 h-56 w-56" aria-hidden="true" />

      <div className="container-verlin relative py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
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
              <Link href="#book">
                <Button size="lg" variant="cta" className="shadow-glow-amber">
                  Book your session now
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="relative hidden aspect-[4/3] overflow-hidden rounded-3xl border border-border/80 shadow-glow-teal surface-elevated lg:block"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <Image
              src="/images/collaboration.jpg"
              alt="Live collaborative learning session"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 0vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-navy/35 via-transparent to-accent-teal/15" />
            <div className="absolute bottom-5 left-5 rounded-2xl border border-cta-amber/30 bg-cta-amber-light px-4 py-3 shadow-md">
              <p className="text-xl font-bold text-navy">Free</p>
              <p className="text-xs font-medium text-text-secondary">No credit card required</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}