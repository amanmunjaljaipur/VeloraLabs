import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "difficulty" | "audience";
  className?: string;
}

const difficultyColors: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  Intermediate: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Advanced: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const isDifficulty = variant === "difficulty" && typeof children === "string";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium",
        isDifficulty
          ? difficultyColors[children as string]
          : "bg-muted text-text-secondary",
        className
      )}
    >
      {children}
    </span>
  );
}