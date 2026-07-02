import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CalendarCheck, Clock, ShieldCheck, Video } from "lucide-react";
import Link from "next/link";

interface FreeSessionHeroProps {
  headline: string;
  description: string;
}

const trustItems = [
  { icon: ShieldCheck, label: "100% free" },
  { icon: Clock, label: "2 hours" },
  { icon: Video, label: "Live online" },
  { icon: CalendarCheck, label: "Easy reschedule" },
];

export function FreeSessionHero({ headline, description }: FreeSessionHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-teal/5 via-background to-background">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-14 md:py-20">
        <div className="max-w-3xl">
          <Badge className="mb-4 bg-teal/10 text-teal border-0">Free introductory session</Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-foreground">
            {headline}
          </h1>
          <p className="mt-5 text-lg text-text-secondary leading-relaxed">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {trustItems.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-sm text-text-secondary"
              >
                <Icon className="h-4 w-4 text-teal" />
                {label}
              </span>
            ))}
          </div>
          <div className="mt-10">
            <Link href="#book">
              <Button size="lg">Book your session now</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}