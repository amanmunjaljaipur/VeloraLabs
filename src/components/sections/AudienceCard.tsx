"use client";

import { Card } from "@/components/ui/Card";
import { Briefcase, Code, GraduationCap, ArrowRight } from "lucide-react";
import Image from "next/image";
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
        <div className="relative -mx-5 -mt-5 mb-5 h-44 overflow-hidden rounded-t-2xl bg-gradient-to-br from-accent-teal/5 via-background to-sky-50/40 md:-mx-8 md:-mt-8">
          <Image
            src={image}
            alt=""
            fill
            className="object-contain p-3 transition-transform duration-250 ease-out group-hover:scale-[1.04]"
            sizes="400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/8 via-transparent to-transparent opacity-0 transition-opacity duration-250 group-hover:opacity-100" />
          <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-card/90 text-accent-teal shadow-md backdrop-blur-sm">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      ) : (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground transition-colors duration-200 group-hover:text-teal">
        {title}
      </h3>
      {description && (
        <p className="mt-2 line-clamp-3 text-sm leading-snug text-text-secondary md:leading-relaxed">
          {description}
        </p>
      )}
      {!onClick && (
        <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-teal opacity-0 transition-all duration-250 group-hover:opacity-100">
          See full track details
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