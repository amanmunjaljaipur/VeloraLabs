import { cn } from "@/lib/utils";

type BrandTone = "default" | "light";

interface VerlinBrandTextProps {
  /**
   * default = light backgrounds (dark “Verlin” + teal gradient “Labs”)
   * light = dark backgrounds (white “Verlin” + teal-light “Labs”) - matches logo tone="light"
   */
  tone?: BrandTone;
  /** Use logo lowercase styling */
  lowercase?: boolean;
  className?: string;
  /** Optional suffix after the brand (e.g. " - clarity-first…") */
  after?: React.ReactNode;
  afterClassName?: string;
}

/**
 * Renders “Verlin Labs” with the same color split as the site logo wordmark.
 * Logo: verlin = --logo-verlin (or white on dark); labs = teal gradient / accent-teal-light.
 */
export function VerlinBrandText({
  tone = "default",
  lowercase = false,
  className,
  after,
  afterClassName,
}: VerlinBrandTextProps) {
  const verlinClass =
    tone === "light" ? "text-white" : "text-[var(--logo-verlin)]";
  const labsClass =
    tone === "light" ? "text-accent-teal-light" : "text-gradient-teal";

  const verlin = lowercase ? "verlin" : "Verlin";
  const labs = lowercase ? "labs" : "Labs";

  return (
    <span className={cn("inline", className)}>
      <span className={verlinClass}>{verlin}</span>
      <span className={labsClass}>
        {lowercase ? "\u00a0" : " "}
        {labs}
      </span>
      {after != null && after !== "" ? (
        <span className={afterClassName}>{after}</span>
      ) : null}
    </span>
  );
}

/** If title starts with “Verlin Labs”, return rest so callers can brand the prefix. */
export function splitVerlinBrandTitle(title: string): {
  hasBrand: boolean;
  rest: string;
} {
  if (/^Verlin Labs\b/i.test(title)) {
    return { hasBrand: true, rest: title.replace(/^Verlin Labs/i, "") };
  }
  return { hasBrand: false, rest: title };
}
