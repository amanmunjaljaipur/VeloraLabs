import { getIntroPricing } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface CoursePriceProps {
  price: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    current: "text-base font-bold",
    original: "text-sm",
    badge: "text-[10px] px-2 py-0.5",
  },
  md: {
    current: "text-2xl font-bold",
    original: "text-base",
    badge: "text-xs px-2.5 py-1",
  },
  lg: {
    current: "text-4xl font-bold",
    original: "text-xl",
    badge: "text-xs px-3 py-1",
  },
};

export function CoursePrice({
  price,
  size = "md",
  showBadge = true,
  className,
}: CoursePriceProps) {
  const pricing = getIntroPricing(price);
  const styles = sizeStyles[size];

  return (
    <div className={cn("space-y-1", className)}>
      {showBadge && (
        <p
          className={cn(
            "inline-flex rounded-full border border-cta-amber/30 bg-cta-amber-light font-semibold uppercase tracking-wide text-navy",
            styles.badge
          )}
        >
          Intro offer · {pricing.discountPercent}% off
        </p>
      )}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p className={cn(styles.current, "text-foreground")}>{pricing.current}</p>
        <p className={cn(styles.original, "text-text-muted line-through decoration-2")}>
          {pricing.original}
        </p>
      </div>
      <p className="text-xs text-text-secondary">You save {pricing.savings}</p>
    </div>
  );
}