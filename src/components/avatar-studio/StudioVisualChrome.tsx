"use client";

/**
 * Image-forward chrome for Avatar Studio — reduces bland text walls.
 * Uses existing brand / avatar assets from /public/images.
 */

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DURATION, EASE_OUT, HOVER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Film, Mic, Sparkles, User } from "lucide-react";
import Image from "next/image";

const HERO_AVATARS = [
  { src: "/images/avatar-priya-sharma.jpg", alt: "Character example" },
  { src: "/images/avatar-sarah-chen.jpg", alt: "Character example" },
  { src: "/images/avatar-arjun-mehta.jpg", alt: "Character example" },
  { src: "/images/avatar-maria-gonzalez.jpg", alt: "Character example" },
] as const;

const JOURNEY = [
  {
    id: "train" as const,
    title: "Train",
    blurb: "Voice + multi-angle face",
    image: "/images/collaboration.jpg",
    icon: Mic,
  },
  {
    id: "create" as const,
    title: "Create",
    blurb: "Script → voice → face",
    image: "/images/presentation.jpg",
    icon: Sparkles,
  },
  {
    id: "videos" as const,
    title: "Watch",
    blurb: "Your finished videos",
    image: "/images/hero-neural-poster.jpg",
    icon: Film,
  },
] as const;

export function StudioHero({
  onCreate,
  onTrain,
}: {
  onCreate: () => void;
  onTrain: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-navy text-white shadow-lg"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-neural-poster.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-40"
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-transparent to-navy/30" />
      </div>

      <div className="relative grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-10 lg:p-12">
        <div className="flex flex-col justify-center gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 text-white">Avatar Studio</Badge>
            <Badge className="border-accent-teal/40 bg-accent-teal/20 text-accent-teal">Free presenter</Badge>
          </div>
          <h1 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Turn a voice &amp; face into a ready-to-watch video
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-white/75 md:text-base">
            Train once. Create in minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-white text-navy hover:bg-white/90 dark:bg-white dark:text-navy"
              onClick={onCreate}
            >
              <Sparkles className="size-4" />
              Create a video
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={onTrain}
            >
              <Mic className="size-4" />
              Train new voice
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Floating character collage */}
        <div className="relative mx-auto flex w-full max-w-sm items-center justify-center md:max-w-none">
          <div className="grid w-full grid-cols-2 gap-3">
            {HERO_AVATARS.map((a, i) => (
              <motion.div
                key={a.src}
                className={cn(
                  "relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/15 shadow-xl",
                  i % 2 === 1 && "mt-6"
                )}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: DURATION.reveal, ease: EASE_OUT }}
                whileHover={reduce ? undefined : { y: HOVER.cardLift, scale: 1.02 }}
              >
                <Image src={a.src} alt={a.alt} fill className="object-cover" sizes="180px" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-[10px] font-medium text-white/90">
                    {i === 0 ? "Cover face" : i === 1 ? "Voice ready" : i === 2 ? "Multi-angle" : "Your cast"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export function StudioJourneyStrip({
  activeTab,
  onSelect,
}: {
  activeTab: string;
  onSelect: (tab: "train" | "create" | "videos") => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-3">
      {JOURNEY.map((item, i) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border text-left shadow-sm transition-shadow",
              active
                ? "border-accent-teal ring-2 ring-accent-teal/30"
                : "border-border hover:border-accent-teal/40 hover:shadow-md"
            )}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: DURATION.reveal, ease: EASE_OUT }}
            whileHover={reduce ? undefined : { y: -3 }}
          >
            <div className="relative h-28 w-full">
              <Image
                src={item.image}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
              <div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
                <Icon className="size-4" />
              </div>
              {active ? (
                <span className="absolute right-3 top-3 rounded-full bg-accent-teal px-2 py-0.5 text-[10px] font-semibold text-white">
                  Now
                </span>
              ) : null}
            </div>
            <div className="bg-card p-3">
              <p className="font-semibold text-foreground">
                {i + 1}. {item.title}
              </p>
              <p className="text-xs text-text-secondary">{item.blurb}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Compact visual empty / tip panel */
export function StudioVisualTip({
  image,
  title,
  children,
  cta,
}: {
  image: string;
  title: string;
  children?: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card sm:flex-row">
      <div className="relative h-36 w-full shrink-0 sm:h-auto sm:w-40">
        <Image src={image} alt="" fill className="object-cover" sizes="160px" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 p-4">
        <p className="font-semibold text-foreground">{title}</p>
        {children ? <div className="text-sm text-text-secondary">{children}</div> : null}
        {cta}
      </div>
    </div>
  );
}

export function StudioStepVisual({
  step,
  title,
  image,
  children,
}: {
  step: number;
  title: string;
  image: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative h-32 w-full md:h-40">
        <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 800px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">Step {step}</p>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 md:p-6">{children}</div>
    </div>
  );
}
