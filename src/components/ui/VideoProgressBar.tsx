import { cn } from "@/lib/utils";

interface VideoProgressBarProps {
  percent: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
  size?: "sm" | "md";
}

export function VideoProgressBar({
  percent,
  className,
  showLabel = true,
  label = "Video progress",
  size = "sm",
}: VideoProgressBarProps) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
          <span>{label}</span>
          <span className="font-medium text-teal">{safePercent}%</span>
        </div>
      )}
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className="h-full rounded-full bg-teal transition-all duration-500"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}