"use client";

import { Card } from "@/components/ui/Card";
import { Briefcase, Code, GraduationCap, ArrowRight } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
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
  image?: string;
  href: string;
  selected?: boolean;
  onClick?: () => void;
}

export function AudienceCard({
  title,
  description,
  icon,
  image,
  href,
  selected,
  onClick,
}: AudienceCardProps) {
  const Icon = icons[icon as keyof typeof icons] || GraduationCap;

  const inner = (
    <>
      {image ? (
        <div className="relative -mx-5 -mt-5 mb-5 h-48 overflow-hidden rounded-t-xl bg-[var(--bg-light)] md:-mx-6 md:-mt-6">
          <OptimizedImage
            src={image}
            alt={`${title} - Verlin Labs AI training program`}
            fill
            className="object-cover object-center transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-card)]/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[var(--canvas)] text-teal shadow-[var(--shadow-product)]">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      ) : (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent-teal/10 text-teal">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="card-title text-lg transition-colors group-hover:text-teal">
        {title}
      </h3>
      {description && (
        <p className="card-body mt-2 line-clamp-3">{description}</p>
      )}
      {!onClick && (
        <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal">
          Learn more
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </p>
      )}
    </>
  );

  const cardClass = cn(
    "h-full overflow-hidden group",
    selected && "border-accent-teal ring-2 ring-accent-teal/20"
  );

  if (onClick) {
    return (
      <Card hover className={cn(cardClass, "cursor-pointer")} onClick={onClick}>
        {inner}
      </Card>
    );
  }

  return (
    <Link href={href} className="block h-full group">
      <Card hover className={cardClass}>
        {inner}
      </Card>
    </Link>
  );
}