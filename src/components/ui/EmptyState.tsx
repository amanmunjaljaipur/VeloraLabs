import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

export function EmptyState({ title, description, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <svg viewBox="0 0 64 64" className="h-12 w-12 text-text-secondary/40" fill="none">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M24 32h16M32 24v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-text-secondary">{description}</p>
      {cta && (
        <a href={cta.href} className="mt-6">
          <Button variant="secondary">{cta.label}</Button>
        </a>
      )}
    </div>
  );
}