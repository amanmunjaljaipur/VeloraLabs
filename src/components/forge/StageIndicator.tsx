"use client";

import type { ForgeStage } from "@/lib/forge/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STAGES: Array<{ id: ForgeStage; label: string }> = [
  { id: "intake", label: "Intake" },
  { id: "discovery", label: "Discovery" },
  { id: "plan", label: "Plan" },
  { id: "build", label: "Build" },
  { id: "preview", label: "Preview" },
];

const ORDER: ForgeStage[] = ["intake", "discovery", "plan", "build", "preview"];

export function StageIndicator({
  stage,
  onJump,
}: {
  stage: ForgeStage;
  onJump?: (s: ForgeStage) => void;
}) {
  const current = ORDER.indexOf(stage);

  return (
    <nav
      aria-label="Forge stages"
      className="flex flex-wrap items-center gap-1 sm:gap-2"
    >
      {STAGES.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = Boolean(onJump) && (done || active || i <= current + 1);
        return (
          <div key={s.id} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && (
              <span
                className={cn(
                  "hidden h-px w-4 sm:block sm:w-6",
                  i <= current ? "bg-accent-teal" : "bg-border"
                )}
              />
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump?.(s.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm",
                active &&
                  "bg-navy text-white shadow-sm dark:bg-accent-teal dark:text-navy",
                done &&
                  !active &&
                  "bg-accent-teal/15 text-accent-teal hover:bg-accent-teal/25",
                !done &&
                  !active &&
                  "bg-muted/60 text-muted-foreground",
                clickable && !active && "cursor-pointer",
                !clickable && "cursor-default opacity-70"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  active && "bg-white/20",
                  done && !active && "bg-accent-teal text-white",
                  !done && !active && "bg-border text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
