import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Clock } from "lucide-react";
import Image from "next/image";

const imageMap: Record<string, string> = {
  "gradient-teal-1": "/images/ai-learning.jpg",
  "gradient-teal-2": "/images/coding.jpg",
  "gradient-teal-3": "/images/professionals.jpg",
  "gradient-teal-4": "/images/students.jpg",
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
  const imageSrc = imageMap[thumbnail] || "/images/mental-models.jpg";

  return (
    <Card hover className="h-full flex flex-col overflow-hidden p-0 group">
      <div className="relative h-44 overflow-hidden">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 300px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
      </div>
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