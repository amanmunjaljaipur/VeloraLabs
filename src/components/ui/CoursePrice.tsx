import { INTRO_OFFER_LABEL, getIntroPricing } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface CoursePriceProps {
  price: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  align?: "start" | "center";
  className?: string;
}

const sizeStyles = {
  sm: {
    badge: "text-[10px] px-2 py-0.5",
    listLabel: "text-xs",
    original: "text-sm",
    current: "text-lg font-bold",
    meta: "text-[11px]",
  },
  md: {
    badge: "text-xs px-2.5 py-1",
    listLabel: "text-sm",
    original: "text-base",
    current: "text-3xl font-bold",
    meta: "text-xs",
  },
  lg: {
    badge: "text-xs px-3 py-1",
    listLabel: "text-sm",
    original: "text-lg",
    current: "text-4xl font-bold",
    meta: "text-sm",
  },
};

export function CoursePrice({
  price,
  size = "md",
  showBadge = true,
  align = "start",
  className,
}: CoursePriceProps) {
  const pricing = getIntroPricing(price);
  const styles = sizeStyles[size];
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "space-y-1",
        isCenter && "flex flex-col items-center text-center",
        className
      )}
      aria-label={`${INTRO_OFFER_LABEL}: ${pricing.current}, list price ${pricing.original}, ${pricing.discountPercent}% off`}
    >
      {showBadge && (
        <p
          className={cn(
            "inline-flex rounded-md bg-cta-amber font-bold uppercase tracking-wide text-white shadow-sm",
            styles.badge
          )}
        >
          {pricing.discountPercent}% off
        </p>
      )}

      <p className={cn(styles.listLabel, "text-text-secondary")}>
        List price{" "}
        <span
          className={cn(
            styles.original,
            "font-medium text-text-muted line-through decoration-2"
          )}
        >
          {pricing.original}
        </span>
      </p>

      <p className={cn(styles.current, "tabular-nums tracking-tight text-teal")}>
        {pricing.current}
      </p>

      <p className={cn(styles.meta, "text-text-secondary")}>
        {INTRO_OFFER_LABEL} · You save {pricing.savings}
      </p>
    </div>
  );
}