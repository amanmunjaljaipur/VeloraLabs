"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Bot, Brain, Code2, Sparkles } from "lucide-react";

interface LearningSplitProps {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
  items?: string[];
  toolIcons?: boolean;
}

export function LearningSplit({
  title,
  description,
  image,
  imageAlt,
  reverse,
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
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-lg">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-deep-teal/30 to-transparent" />
        {toolIcons && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            {[Brain, Sparkles, Bot, Code2].map((Icon, i) => (
              <div
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-card/90 text-teal shadow-sm backdrop-blur-sm"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl md:text-3xl font-semibold text-foreground">{title}</h3>
        <p className="mt-4 text-text-secondary leading-relaxed">{description}</p>
        {items && (
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-teal" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}