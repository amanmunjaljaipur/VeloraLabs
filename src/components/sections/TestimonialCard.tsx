import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TESTIMONIAL_AVATARS } from "@/lib/home-content";
import { Quote } from "lucide-react";
import Image from "next/image";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  audience: string;
}

const audienceLabels: Record<string, string> = {
  students: "Student",
  engineers: "Engineer",
  professionals: "Professional",
};

export function TestimonialCard({ quote, name, role, audience }: TestimonialCardProps) {
  const avatarSrc = TESTIMONIAL_AVATARS[name];

  return (
    <Card hover className="relative flex h-full flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent-teal/5"
        aria-hidden="true"
      />
      <Quote
        className="mb-4 h-8 w-8 text-accent-teal/30"
        aria-hidden="true"
      />
      <p className="relative flex-1 text-base leading-relaxed text-foreground">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-8 flex items-center gap-4 border-t border-border/60 pt-6">
        {avatarSrc ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-accent-teal/25 shadow-sm">
            <Image src={avatarSrc} alt={`${name} avatar`} fill className="object-cover" sizes="48px" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-accent-teal text-sm font-semibold text-white shadow-sm">
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-sm text-text-secondary">{role}</p>
        </div>
        <Badge variant="audience" className="shrink-0">
          {audienceLabels[audience] || audience}
        </Badge>
      </div>
    </Card>
  );
}