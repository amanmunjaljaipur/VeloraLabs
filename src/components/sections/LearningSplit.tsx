"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Bot, Brain, CalendarCheck, Code2, Rocket, Sparkles, Trophy } from "lucide-react";
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
      className={`grid gap-10 lg:grid-cols-2 lg:items-center ${
        reverse ? "lg:[&>*:first-child]:order-2" : ""
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45 }}
    >
      <div
        className={cn(
          "group relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/80 shadow-lg transition-shadow duration-300 hover:shadow-xl",
          illustration && "border-accent-teal/15 bg-gradient-to-br from-accent-teal/5 via-background to-sky-50/30"
        )}
      >
        <Image
          src={image}
          alt={imageAlt}
          fill
          className={cn(
            "transition-transform duration-500 group-hover:scale-[1.02]",
            illustration ? "object-contain p-4 md:p-6" : "object-cover"
          )}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {!illustration && (
          <>
            <div className="absolute inset-0 bg-gradient-to-tr from-navy/35 via-transparent to-accent-teal/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/15 to-transparent" />
          </>
        )}
        {toolIcons && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            {stepIcons.map((Icon, i) => (
              <div
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/90 text-accent-teal shadow-sm backdrop-blur-sm"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            ))}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/90 text-accent-teal shadow-sm backdrop-blur-sm">
              <Rocket className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        )}
        {!toolIcons && illustration && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {[Brain, Sparkles, Bot].map((Icon, i) => (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card/80 text-accent-teal shadow-sm backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-heading text-2xl md:text-3xl">{title}</h3>
        <p className="mt-4 text-body">{description}</p>
        {items && (
          <ul className="mt-8 space-y-4">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-teal/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-teal" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}