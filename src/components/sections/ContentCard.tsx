import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Clock } from "lucide-react";

const thumbnails: Record<string, string> = {
  "gradient-teal-1": "from-teal/30 to-accent-teal/20",
  "gradient-teal-2": "from-deep-teal/30 to-teal/20",
  "gradient-teal-3": "from-accent-teal/30 to-teal/10",
  "gradient-teal-4": "from-teal/20 to-deep-teal/30",
};

interface ContentCardProps {
  title: string;
  description: string;
  duration: string;
  level: string;
  type: string;
  thumbnail: string;
}

export function ContentCard({ title, description, duration, level, type, thumbnail }: ContentCardProps) {
  return (
    <Card hover className="h-full flex flex-col overflow-hidden p-0">
      <div className={`h-40 bg-gradient-to-br ${thumbnails[thumbnail] || thumbnails["gradient-teal-1"]}`} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="difficulty">{level}</Badge>
          <Badge>{type}</Badge>
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed flex-1">{description}</p>
        <div className="mt-4 flex items-center gap-1.5 text-sm text-text-secondary">
          <Clock className="h-4 w-4" />
          {duration}
        </div>
      </div>
    </Card>
  );
}