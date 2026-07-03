import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        centered && "mx-auto max-w-2xl text-center",
        !centered && "max-w-2xl",
        className
      )}
    >
      {eyebrow && <p className="section-eyebrow mb-4">{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {subtitle && (
        <p className={cn("section-subtitle", centered && "mx-auto")}>{subtitle}</p>
      )}
    </div>
  );
}