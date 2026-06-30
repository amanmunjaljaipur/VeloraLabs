"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CalendarProps {
  selected: Date | null;
  onSelect: (date: Date) => void;
}

export function Calendar({ selected, onSelect }: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-semibold text-foreground">{monthLabel}</span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-secondary mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const date = new Date(year, month, day);
          const isPast = date < today;
          const isSelected =
            selected?.getDate() === day &&
            selected?.getMonth() === month &&
            selected?.getFullYear() === year;

          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => onSelect(date)}
              className={cn(
                "rounded-xl py-2.5 text-sm font-medium transition-colors",
                isPast && "text-text-secondary/30 cursor-not-allowed",
                !isPast && !isSelected && "hover:bg-muted text-foreground",
                isSelected && "bg-deep-teal text-white"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}