import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { FaqCategory } from "@/lib/content";
import { BookOpen, CalendarClock, CircleHelp, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface SessionFaqProps {
  categories: FaqCategory[];
}

const categoryIcons: LucideIcon[] = [CircleHelp, BookOpen, CalendarClock];

export function SessionFaq({ categories }: SessionFaqProps) {
  const totalQuestions = categories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <section className="border-t border-border bg-muted/20 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-16">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-medium uppercase tracking-wider text-teal">Help center</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl lg:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 max-w-md text-text-secondary leading-relaxed">
              Quick answers about booking, preparing, and what happens after your free session.
            </p>

            <Card className="mt-8 border-teal/20 bg-card/90 p-5 md:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Still have questions?</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Our team typically responds within one business day. We&apos;re happy to help you
                choose the right session track.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link href="/contact">
                  <Button size="sm" className="w-full sm:w-auto lg:w-full">
                    Contact support
                  </Button>
                </Link>
                <Link href="#book">
                  <Button size="sm" variant="secondary" className="w-full sm:w-auto lg:w-full">
                    Book a session
                  </Button>
                </Link>
              </div>
            </Card>

            <p className="mt-6 text-xs text-text-secondary">
              {totalQuestions} answers across {categories.length} topics
            </p>
          </div>

          <div className="space-y-10">
            {categories.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];

              return (
                <div key={category.title}>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{category.description}</p>
                    </div>
                  </div>
                  <Accordion items={category.items} defaultOpenIndex={index === 0 ? 0 : null} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}