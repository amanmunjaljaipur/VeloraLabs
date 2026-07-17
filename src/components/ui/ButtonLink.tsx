"use client";

import { buttonClassNames, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { DURATION, EASE_OUT, HOVER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Keep the link full width at all breakpoints (useful in grids). */
  fullWidth?: boolean;
  /** Entrance animation delay (seconds) */
  delay?: number;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  fullWidth = false,
  delay = 0,
}: ButtonLinkProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("inline-flex w-full", !fullWidth && "sm:w-auto")}
      initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: EASE_OUT }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              scale: HOVER.buttonScale[variant],
              transition: { duration: DURATION.hover, ease: EASE_OUT },
            }
      }
      whileTap={
        reduceMotion
          ? undefined
          : { scale: HOVER.tapScale, transition: { duration: DURATION.press, ease: EASE_OUT } }
      }
    >
      <Link
        href={href}
        className={cn(buttonClassNames(variant, size), "w-full", !fullWidth && "sm:w-auto", className)}
      >
        {children}
      </Link>
    </motion.div>
  );
}