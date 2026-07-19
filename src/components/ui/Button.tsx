"use client";

import { DURATION, EASE_OUT, HOVER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "cta";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  size?: ButtonSize;
}

export function buttonClassNames(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  /* Touch targets: md ≥44px, lg ≥48px (ui-ux-pro-max) */
  const sizes = {
    sm: "h-9 min-h-9 px-4 text-sm",
    md: "h-11 min-h-11 px-5 text-[0.9375rem] md:h-12 md:min-h-12 md:px-6",
    lg: "h-12 min-h-12 px-7 text-base font-semibold md:h-14 md:min-h-14 md:px-8 md:text-lg",
  };

  /* OpenAI-inspired: soft primary black, quiet secondary, amber only for conversion.
     --navy is a fixed dark ink (used by the footer/scrims too), so primary must
     invert explicitly in dark mode - otherwise it's a near-black pill on a
     near-black dark-mode page. */
  const variants = {
    primary:
      "bg-navy text-white shadow-none hover:bg-navy-muted dark:bg-white dark:text-navy dark:hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-navy/30 dark:focus-visible:ring-white/40 focus-visible:ring-offset-2",
    cta:
      "bg-cta-amber text-navy font-semibold shadow-none hover:bg-cta-amber-hover focus-visible:ring-2 focus-visible:ring-cta-amber/40 focus-visible:ring-offset-2",
    secondary:
      "border border-border/90 bg-transparent text-foreground shadow-none hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-navy/20 focus-visible:ring-offset-2",
  };

  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium tracking-tight",
    "transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 ease-out",
    sizes[size],
    variants[variant],
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, size = "md", children, disabled, type = "button", ...props }, ref) => {
    const reduceMotion = useReducedMotion();
    const isDisabled = disabled || loading;

    return (
      <motion.span
        className={cn("inline-flex max-w-full", className?.includes("w-full") && "w-full")}
        whileHover={
          reduceMotion || isDisabled
            ? undefined
            : {
                scale: HOVER.buttonScale[variant],
                y: -1,
                transition: { duration: DURATION.hover, ease: EASE_OUT },
              }
        }
        whileTap={
          reduceMotion || isDisabled
            ? undefined
            : { scale: HOVER.tapScale, y: 0, transition: { duration: DURATION.press, ease: EASE_OUT } }
        }
      >
        <button
          ref={ref}
          type={type}
          disabled={isDisabled}
          className={cn(
            buttonClassNames(variant, size, className),
            isDisabled && "cursor-not-allowed opacity-50"
          )}
          {...props}
        >
        {loading && (
          <motion.span
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="inline-flex"
          >
            <Loader2 className="h-4 w-4" />
          </motion.span>
        )}
        {children}
        </button>
      </motion.span>
    );
  }
);
Button.displayName = "Button";