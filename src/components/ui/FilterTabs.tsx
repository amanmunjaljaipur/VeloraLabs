"use client";

import { cn } from "@/lib/utils";

interface FilterTabsProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterTabs({ label, options, value, onChange }: FilterTabsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              value === opt.value
                ? "border-teal bg-teal/10 text-teal"
                : "border-border bg-card text-text-secondary hover:border-teal/40 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}