import { Card } from "@/components/ui/Card";
import { Briefcase, Code, GraduationCap } from "lucide-react";
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
        <div className="relative -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-4 h-40 overflow-hidden rounded-t-2xl">
          <Image src={image} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="400px" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          <div className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-card/90 backdrop-blur-sm text-teal shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal mb-4">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p>
      )}
      {!onClick && (
        <p className="mt-4 text-sm font-medium text-teal opacity-0 transition-opacity group-hover:opacity-100">
          See full track details →
        </p>
      )}
    </>
  );

  if (onClick) {
    return (
      <Card
        hover
        className={cn("cursor-pointer h-full group overflow-hidden", selected && "border-teal ring-2 ring-teal/20")}
        onClick={onClick}
      >
        {inner}
      </Card>
    );
  }

  return (
    <Link href={href} className="block h-full group">
      <Card hover className={cn("h-full overflow-hidden", selected && "border-teal ring-2 ring-teal/20")}>
        {inner}
      </Card>
    </Link>
  );
}