import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "difficulty"
  | "audience";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const difficultyColors: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  Intermediate: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Advanced: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

const variantClass: Record<Exclude<BadgeVariant, "difficulty" | "audience">, string> = {
  default: "bg-muted text-text-secondary",
  secondary: "bg-navy/10 text-navy dark:bg-white/10 dark:text-white",
  outline: "border border-border bg-transparent text-text-secondary",
  success: "bg-accent-teal/15 text-teal dark:text-accent-teal-light",
  warning: "bg-cta-amber/15 text-cta-amber",
  destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  info: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const isDifficulty = variant === "difficulty" && typeof children === "string";
  let tone = variantClass.default;
  if (isDifficulty) {
    tone = difficultyColors[children as string] ?? variantClass.default;
  } else if (variant === "audience") {
    tone = variantClass.default;
  } else if (variant in variantClass) {
    tone = variantClass[variant as keyof typeof variantClass];
  }
  return (
    <span className={cn("inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium", tone, className)}>
      {children}
    </span>
  );
}