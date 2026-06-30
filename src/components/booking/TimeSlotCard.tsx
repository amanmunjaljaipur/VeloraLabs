"use client";

import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface TimeSlotCardProps {
  time: string;
  available: number;
  total: number;
  selected: boolean;
  onClick: () => void;
}

export function TimeSlotCard({ time, available, total, selected, onClick }: TimeSlotCardProps) {
  const disabled = available === 0;
  const limited = available > 0 && available <= 2;

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative rounded-xl border p-4 text-left transition-all",
        disabled && "opacity-40 cursor-not-allowed border-border",
        !disabled && !selected && "border-border hover:border-teal hover:shadow-sm",
        selected && "border-teal ring-2 ring-teal/20 bg-teal/5"
      )}
    >
      <span className="font-medium text-foreground">{formatTime(time)}</span>
      {limited && (
        <Badge className="mt-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Limited slots left
        </Badge>
      )}
      {!disabled && !limited && (
        <p className="mt-1 text-xs text-text-secondary">{available} of {total} available</p>
      )}
      {disabled && <p className="mt-1 text-xs text-text-secondary">Fully booked</p>}
    </button>
  );
}