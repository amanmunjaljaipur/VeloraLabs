import { Button } from "./Button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  cta?: { label: string; href: string };
  /** Optional action node instead of / in addition to href CTA */
  action?: ReactNode;
}

export function EmptyState({ title, description, cta, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-24 items-center justify-center rounded-full bg-muted">
        <svg viewBox="0 0 64 64" className="size-12 text-text-secondary/40" fill="none" aria-hidden>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M24 32h16M32 24v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="max-w-md text-text-secondary">{description}</p>
      </div>
      {action}
      {cta ? (
        <a href={cta.href}>
          <Button variant="secondary">{cta.label}</Button>
        </a>
      ) : null}
    </div>
  );
}