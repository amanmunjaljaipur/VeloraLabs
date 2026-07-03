"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "cta";
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, size = "md", children, disabled, ...props }, ref) => {
    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-12 px-6 text-base",
      lg: "h-14 px-8 text-lg",
    };

    const variants = {
      primary:
        "bg-navy text-white hover:bg-navy-muted hover:shadow-md active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-accent-teal/40 focus-visible:ring-offset-2",
      cta:
        "bg-cta-amber text-navy font-semibold hover:bg-cta-amber-hover hover:shadow-glow-amber active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-cta-amber/50 focus-visible:ring-offset-2",
      secondary:
        "border border-border bg-card/50 text-foreground backdrop-blur-sm hover:border-accent-teal/50 hover:bg-accent-teal/5 hover:text-accent-teal hover:shadow-sm shadow-xs focus-visible:ring-2 focus-visible:ring-accent-teal/30 focus-visible:ring-offset-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          sizes[size],
          variants[variant],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";