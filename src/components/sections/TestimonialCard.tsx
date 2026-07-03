import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TESTIMONIAL_AVATARS } from "@/lib/home-content";
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
    <Card className="flex h-full flex-col">
      <p className="flex-1 leading-relaxed text-foreground">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6 flex items-center gap-4">
        {avatarSrc ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-teal/20">
            <Image src={avatarSrc} alt={`${name} avatar`} fill className="object-cover" sizes="44px" />
          </div>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-accent-teal text-sm font-semibold text-white">
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-sm text-text-secondary">{role}</p>
        </div>
        <Badge variant="audience" className="ml-auto shrink-0">
          {audienceLabels[audience] || audience}
        </Badge>
      </div>
    </Card>
  );
}