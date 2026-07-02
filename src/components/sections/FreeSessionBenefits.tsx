import { Card } from "@/components/ui/Card";
import {
  BookOpen,
  Brain,
  Gift,
  MessageCircle,
  Route,
  Sparkles,
} from "lucide-react";

const icons = [Brain, Sparkles, Route, MessageCircle, BookOpen, Gift];

interface FreeSessionBenefitsProps {
  benefits: { title: string; description: string }[];
}

export function FreeSessionBenefits({ benefits }: FreeSessionBenefitsProps) {
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            What you&apos;ll walk away with
          </h2>
          <p className="mt-3 text-text-secondary">
            A focused session designed to show you how clarity-first learning works — not a sales pitch.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Card key={benefit.title} className="h-full">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{benefit.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}