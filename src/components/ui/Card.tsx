"use client";

import { DURATION, EASE_OUT, HOVER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover, children, onClick, id, role, tabIndex, "aria-label": ariaLabel }: CardProps) {
  const reduceMotion = useReducedMotion();
  const classes = cn(
    "card-verlin rounded-2xl p-5 text-card-foreground md:p-8",
    hover &&
      "card-verlin-hover transition-shadow duration-[250ms] hover:border-accent-teal/25 hover:shadow-lg",
    className
  );

  if (!hover) {
    return (
      <div className={classes} onClick={onClick} id={id} role={role} tabIndex={tabIndex} aria-label={ariaLabel}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: HOVER.cardLift,
              transition: { duration: 0.25, ease: EASE_OUT },
            }
      }
      className={classes}
      onClick={onClick}
      id={id}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
    >
      {children}
    </motion.div>
  );
}