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
  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-5 text-[0.9375rem] md:h-12 md:px-6",
    lg: "h-12 px-7 text-base font-semibold md:h-14 md:px-8 md:text-lg",
  };

  /* Prod conversion weight + Apple pill + Verlin colors */
  const variants = {
    primary:
      "bg-navy text-white shadow-sm hover:bg-navy-muted focus-visible:ring-2 focus-visible:ring-accent-teal/40 focus-visible:ring-offset-2",
    cta:
      "bg-cta-amber text-navy font-bold shadow-sm hover:bg-cta-amber-hover hover:shadow-[var(--shadow-glow-amber)] focus-visible:ring-2 focus-visible:ring-cta-amber/50 focus-visible:ring-offset-2",
    secondary:
      "border border-border bg-card text-foreground shadow-none hover:border-accent-teal/45 hover:bg-accent-teal/5 hover:text-accent-teal focus-visible:ring-2 focus-visible:ring-accent-teal/30 focus-visible:ring-offset-2",
  };

  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-200 ease-out",
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
        className="inline-flex"
        whileHover={
          reduceMotion || isDisabled
            ? undefined
            : {
                scale: HOVER.buttonScale[variant],
                transition: { duration: DURATION.hover, ease: EASE_OUT },
              }
        }
        whileTap={
          reduceMotion || isDisabled
            ? undefined
            : { scale: HOVER.tapScale, transition: { duration: DURATION.press, ease: EASE_OUT } }
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