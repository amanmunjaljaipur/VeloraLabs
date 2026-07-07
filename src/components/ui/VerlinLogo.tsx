import { VerlinBrandMark } from "@/components/ui/VerlinBrandMark";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface VerlinLogoProps {
  variant?: "full" | "icon";
  /** Force light wordmark on dark surfaces (e.g. footer). */
  tone?: "default" | "light";
  className?: string;
}

function VerlinWordmark({ tone }: { tone: "default" | "light" }) {
  const verlinClass =
    tone === "light" ? "text-white" : "text-[var(--logo-verlin)]";
  const labsClass =
    tone === "light" ? "text-accent-teal-light" : "text-gradient-teal";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-baseline font-extrabold lowercase leading-none tracking-[-0.045em]",
        "text-[clamp(1.25rem,2.5vw,1.6rem)]"
      )}
      style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
    >
      <span className={verlinClass}>verlin</span>
      <span className={labsClass}>&nbsp;labs</span>
    </span>
  );
}

export function VerlinLogo({ variant = "full", tone = "default", className }: VerlinLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90 sm:gap-3",
        className
      )}
    >
      <span className="sr-only">Verlin Labs</span>
      <VerlinBrandMark className="transition-transform duration-200 group-hover:scale-[1.02]" />
      {variant === "full" && <VerlinWordmark tone={tone} />}
    </Link>
  );
}