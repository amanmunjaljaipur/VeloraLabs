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
      <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/80 shadow-lg transition-shadow duration-300 hover:shadow-xl">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-navy/35 via-transparent to-accent-teal/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/15 to-transparent" />
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