"use client";

import { MediaFrame } from "@/components/ui/MediaFrame";
import { cn } from "@/lib/utils";

export type HeroVisualVariant = "home" | "freeSession" | "minimal";

interface HeroVisualProps {
  posterSrc: string;
  posterAlt: string;
  videoSrc?: string | null;
  className?: string;
  compact?: boolean;
  variant?: HeroVisualVariant;
  tone?: "dark" | "light";
  badge?: string;
  showFloats?: boolean;
  rounded?: boolean;
  priority?: boolean;
}

/** @deprecated Prefer MediaFrame - kept for free-session / legacy imports */
export function HeroVisual({
  posterSrc,
  posterAlt,
  videoSrc,
  className,
  compact = false,
  rounded = false,
  priority = true,
}: HeroVisualProps) {
  return (
    <MediaFrame
      image={posterSrc}
      alt={posterAlt}
      video={videoSrc}
      priority={priority}
      rounded={rounded}
      scrim="none"
      sharpText
      className={cn(
        compact ? "min-h-[200px] sm:min-h-[240px]" : "h-full min-h-[240px]",
        className
      )}
      sizes={compact ? "100vw" : "(min-width: 1024px) 896px, 100vw"}
    />
  );
}
