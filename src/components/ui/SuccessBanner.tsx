"use client";

import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface SuccessBannerProps {
  title: string;
  description?: string;
  className?: string;
}

export function SuccessBanner({ title, description, className }: SuccessBannerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: DURATION.success, ease: EASE_OUT }}
      className={cn(
        "rounded-2xl border border-accent-teal/20 bg-accent-teal/5 px-6 py-8",
        className
      )}
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
        animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT }}
        className="mx-auto flex h-10 w-10 items-center justify-center"
      >
        <CheckCircle2 className="h-10 w-10 text-accent-teal" strokeWidth={2} />
      </motion.div>
      <p className="mt-3 font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
    </motion.div>
  );
}