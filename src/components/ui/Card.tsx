"use client";

import { DURATION, EASE_OUT, HOVER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { HTMLAttributes, type ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  /** "glass" = frosted, translucent premium surface (Cult UI-inspired) instead of the flat card. */
  variant?: "default" | "glass";
  /** Drop default padding when using CardHeader/Content composition. */
  flush?: boolean;
}

export function Card({
  className,
  hover,
  variant = "default",
  flush,
  children,
  onClick,
  id,
  role,
  tabIndex,
  "aria-label": ariaLabel,
}: CardProps) {
  const reduceMotion = useReducedMotion();
  const classes = cn(
    variant === "glass"
      ? "surface-glass rounded-xl border border-border/60 text-card-foreground shadow-glow-teal"
      : "card-verlin rounded-xl text-card-foreground",
    !flush && "p-5 md:p-6",
    hover && "card-verlin-hover",
    /* Equal height grids need min-w-0 so content never blows columns */
    "min-w-0",
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
              transition: { duration: DURATION.hover + 0.04, ease: EASE_OUT },
            }
      }
      className={cn(classes, onClick && "cursor-pointer")}
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

/** shadcn-style composition helpers on Verlin Card */
export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-1.5 p-5 pb-0 md:p-6 md:pb-0", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold tracking-tight text-foreground", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-text-secondary", className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4 p-5 md:p-6", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-t border-border/60 p-5 md:p-6", className)}>
      {children}
    </div>
  );
}