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
  fullWidth?: boolean;
  /** Kept for API compat; entrance delay no longer used (less AI-template) */
  delay?: number;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  fullWidth = false,
}: ButtonLinkProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        fullWidth ? "block w-full min-w-0" : "inline-flex w-full sm:w-auto"
      )}
      whileHover={
        reduceMotion
          ? undefined
          : {
              scale: HOVER.buttonScale[variant],
              y: -1,
              transition: { duration: DURATION.hover, ease: EASE_OUT },
            }
      }
      whileTap={
        reduceMotion
          ? undefined
          : {
              scale: HOVER.tapScale,
              y: 0,
              transition: { duration: DURATION.press, ease: EASE_OUT },
            }
      }
    >
      <Link
        href={href}
        className={cn(
          buttonClassNames(variant, size),
          "w-full",
          !fullWidth && "sm:w-auto",
          className
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}
