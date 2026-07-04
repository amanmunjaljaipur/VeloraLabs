import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";
import Link from "next/link";

/** Bright cyan-teal from brand wordmark — matches reference logo "labs" color */
const LOGO_LABS = "var(--logo-labs, #24d4ee)";
const BRAND_ICON = "/images/verlin-brand-icon.png";

interface VerlinLogoProps {
  variant?: "full" | "icon";
  /** Force light wordmark on dark surfaces (e.g. footer). */
  tone?: "default" | "light";
  className?: string;
}

function VerlinBrandIcon({ className }: { className?: string }) {
  return (
    <OptimizedImage
      src={BRAND_ICON}
      alt=""
      width={48}
      height={48}
      aboveFold
      className={cn(
        "h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10",
        className
      )}
    />
  );
}

function VerlinWordmark({ tone }: { tone: "default" | "light" }) {
  const verlinClass =
    tone === "light" ? "text-white" : "text-[var(--logo-verlin)]";

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
      <span style={{ color: LOGO_LABS }}>&nbsp;labs</span>
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
      <VerlinBrandIcon />
      {variant === "full" && <VerlinWordmark tone={tone} />}
    </Link>
  );
}