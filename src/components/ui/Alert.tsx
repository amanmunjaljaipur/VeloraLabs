import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

type AlertVariant = "default" | "destructive" | "success" | "info" | "warning";

const variantClass: Record<AlertVariant, string> = {
  default: "border-border bg-muted/50 text-foreground",
  destructive:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100",
  success:
    "border-accent-teal/30 bg-accent-teal/10 text-foreground",
  info: "border-border bg-card text-foreground",
  warning: "border-cta-amber/40 bg-cta-amber/10 text-foreground",
};

const Icon = {
  default: Info,
  destructive: AlertTriangle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
} as const;

export function Alert({
  variant = "default",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const Glyph = Icon[variant];
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        variantClass[variant],
        className
      )}
    >
      <Glyph className="mt-0.5 size-4 shrink-0 opacity-80" aria-hidden />
      <div className="flex min-w-0 flex-col gap-1">
        {title ? <p className="font-medium leading-none">{title}</p> : null}
        {children ? <div className="text-sm opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}
