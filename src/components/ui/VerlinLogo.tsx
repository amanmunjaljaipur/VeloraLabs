import { cn } from "@/lib/utils";
import Link from "next/link";

interface VerlinLogoProps {
  variant?: "full" | "icon";
  className?: string;
}

export function VerlinLogo({ variant = "full", className }: VerlinLogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-3 group", className)}>
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="verlin-grad-1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0E6B66" />
            <stop offset="100%" stopColor="#14A39B" />
          </linearGradient>
          <linearGradient id="verlin-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#14A39B" />
            <stop offset="100%" stopColor="#0A3D3A" />
          </linearGradient>
        </defs>
        <path
          d="M8 32 C8 20, 16 8, 28 8 C22 14, 18 24, 20 32 Z"
          fill="url(#verlin-grad-1)"
          className="transition-transform group-hover:scale-105"
        />
        <path
          d="M32 8 C32 20, 24 32, 12 32 C18 26, 22 16, 20 8 Z"
          fill="url(#verlin-grad-2)"
          opacity="0.85"
          className="transition-transform group-hover:scale-105"
        />
      </svg>
      {variant === "full" && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Verlin <span className="text-teal">Labs</span>
        </span>
      )}
    </Link>
  );
}