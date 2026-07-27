import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Vertical field stack — prefer over ad-hoc space-y stacks. */
export function FieldGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
}

export function Field({
  children,
  className,
  invalid,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      data-invalid={invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn("flex flex-col gap-2", className)}
    >
      {children}
    </div>
  );
}

export function FieldLabel({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("text-sm font-medium text-foreground", className)}>
      {children}
    </label>
  );
}

export function FieldDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("text-xs text-text-secondary", className)}>{children}</p>;
}

export function FieldError({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return <p className={cn("text-sm text-red-600 dark:text-red-400", className)}>{children}</p>;
}
