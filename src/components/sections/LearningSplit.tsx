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
          "group relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/80 shadow-lg transition-shadow duration-300 hover:shadow-xl",
          illustration && "border-accent-teal/15 bg-gradient-to-br from-accent-teal/5 via-background to-sky-50/30"
        )}
      >
        <OptimizedImage
          src={image}
          alt={imageAlt}
          fill
          className={cn(
            "transition-transform duration-500 group-hover:scale-[1.02]",
            illustration ? "object-cover object-center" : "object-cover"
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