import { cn } from "@/lib/utils";
import { useId } from "react";

interface VerlinBrandMarkProps {
  className?: string;
}

/** Theme-aligned flowing V mark - teal gradient from the design system. */
export function VerlinBrandMark({ className }: VerlinBrandMarkProps) {
  const rawId = useId();
  const gradientId = `verlin-v-${rawId.replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("h-9 w-9 shrink-0 sm:h-10 sm:w-10", className)}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="8"
          y1="40"
          x2="40"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--teal)" />
          <stop offset="50%" stopColor="var(--accent-teal)" />
          <stop offset="100%" stopColor="var(--accent-teal-light)" />
        </linearGradient>
      </defs>

      {/* Flowing ribbon V - left arm */}
      <path
        d="M8.5 7.2c-1 .6-1.4 1.9-.9 3 3.2 8.2 7 16.8 12.2 25.2.9.2 1.7.2 2.5 0-4.8-8-8.2-16-10.8-24-.4-1.1 0-2.2.9-2.8.1-.1.3-.2.5-.2.1 0 .4.1.6.1Z"
        fill={`url(#${gradientId})`}
      />

      {/* Right arm */}
      <path
        d="M39.5 7.2c1 .6 1.4 1.9.9 3-3.2 8.2-7 16.8-12.2 25.2-.9.2-1.7.2-2.5 0 4.8-8 8.2-16 10.8-24 .4-1.1 0-2.2-.9-2.8-.1-.1-.3-.2-.5-.2-.1 0-.4.1-.6.1Z"
        fill={`url(#${gradientId})`}
        opacity="0.9"
      />

      {/* Center crease */}
      <path
        d="M22.2 36.8c1.4-4.8 2.2-9.6 2.2-14.4 0-3.6-.4-7.2-1.6-10.6 1.2 3.2 1.8 6.6 1.8 10.6 0 5-.8 9.8-2.4 14.4Z"
        fill="var(--accent-teal-light)"
        opacity="0.35"
      />
    </svg>
  );
}