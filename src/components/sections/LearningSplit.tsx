"use client";

import { motion } from "framer-motion";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Bot, Brain, CalendarCheck, Check, Code2, Rocket, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningSplitProps {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
  illustration?: boolean;
  items?: string[];
  toolIcons?: boolean;
}

const stepIcons = [CalendarCheck, Code2, Trophy];

export function LearningSplit({
  title,
  description,
  image,
  imageAlt,
  reverse,
  illustration,
  items,
  toolIcons,
}: LearningSplitProps) {
  return (
    <motion.div
      className={cn(
        "grid gap-8 md:gap-12 lg:grid-cols-2 lg:items-center",
        reverse && "lg:[&>*:first-child]:order-2"
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45 }}
    >
      <div
        className={cn(
          "group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-[var(--surface-card)] shadow-[var(--shadow-product)]"
        )}
      >
        <OptimizedImage
          src={image}
          alt={imageAlt}
          fill
          className={cn(
            "transition-transform duration-500 group-hover:scale-[1.015]",
            illustration ? "object-cover object-center" : "object-cover"
          )}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {toolIcons && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            {stepIcons.map((Icon, i) => (
              <div
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-[rgba(210,210,215,0.64)] text-navy backdrop-blur-sm"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            ))}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-[rgba(210,210,215,0.64)] text-navy backdrop-blur-sm">
              <Rocket className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        )}
        {!toolIcons && illustration && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {[Brain, Sparkles, Bot].map((Icon, i) => (
              <div
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-[rgba(210,210,215,0.64)] text-navy backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-heading">{title}</h3>
        <p className="text-body-lead mt-4">{description}</p>
        {items && items.length > 0 && (
          <ul className="list-verlin mt-6 md:mt-8">
            {items.map((item, index) => (
              <li key={item}>
                <span className="list-verlin-marker" aria-hidden="true">
                  <Check strokeWidth={3} />
                </span>
                <span>
                  <span className="sr-only">Point {index + 1}: </span>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}