import { cn } from "@/lib/utils";

interface SectionShellProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  /** Subtle top border divider */
  divider?: boolean;
  /** Muted background band */
  tinted?: boolean;
  /** Wrap content in elevated card panel (great for mobile scannability) */
  panel?: boolean;
  size?: "default" | "lg";
}

export function SectionShell({
  id,
  children,
  className,
  divider = true,
  tinted = false,
  panel = false,
  size = "default",
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20",
        size === "lg" ? "section-y-lg" : "section-y",
        divider && "section-divider",
        tinted && "bg-muted/25",
        className
      )}
    >
      <div className="container-verlin">
        {panel ? (
          <div className="section-panel">{children}</div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}