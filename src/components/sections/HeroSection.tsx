import { Button } from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroSectionProps {
  tagline: string;
  description: string;
}

export function HeroSection({ tagline, description }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/collaboration.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70 md:to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-20 md:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 backdrop-blur-sm px-4 py-1.5 text-sm text-text-secondary">
              <Sparkles className="h-4 w-4 text-accent-teal" />
              Clarity-first learning for the AI age
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-foreground">
              {tagline}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-text-secondary leading-relaxed">
              {description}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/free-session">
                <Button size="lg">Book Free 2-Hour Session</Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="secondary">
                  Explore Programs <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-2xl">
              <Image
                src="/images/hero-side.jpg"
                alt="Students in a live classroom workshop"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0vw, 50vw"
                priority
              />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl border border-border bg-card p-4 shadow-lg backdrop-blur-sm">
              <p className="text-2xl font-semibold text-teal">16 days</p>
              <p className="text-xs text-text-secondary">PM program · MVP to launch</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}