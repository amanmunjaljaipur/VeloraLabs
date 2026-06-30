import { Card } from "@/components/ui/Card";
import { Briefcase, Code, GraduationCap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const icons = {
  "graduation-cap": GraduationCap,
  code: Code,
  briefcase: Briefcase,
};

interface AudienceCardProps {
  title: string;
  shortTitle?: string;
  description?: string;
  icon: string;
  href: string;
  selected?: boolean;
  onClick?: () => void;
}

export function AudienceCard({
  title,
  description,
  icon,
  href,
  selected,
  onClick,
}: AudienceCardProps) {
  const Icon = icons[icon as keyof typeof icons] || GraduationCap;

  const inner = (
    <>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p>
      )}
    </>
  );

  if (onClick) {
    return (
      <Card
        hover
        className={cn("cursor-pointer h-full", selected && "border-teal ring-2 ring-teal/20")}
        onClick={onClick}
      >
        {inner}
      </Card>
    );
  }

  return (
    <Link href={href} className="block h-full">
      <Card hover className={cn("h-full", selected && "border-teal ring-2 ring-teal/20")}>
        {inner}
      </Card>
    </Link>
  );
}