import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
  return (
    <Card className="h-full flex flex-col">
      <p className="text-foreground leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal to-accent-teal text-white text-sm font-semibold">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-sm text-text-secondary">{role}</p>
        </div>
        <Badge variant="audience" className="ml-auto">
          {audienceLabels[audience] || audience}
        </Badge>
      </div>
    </Card>
  );
}