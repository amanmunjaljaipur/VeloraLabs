import { Badge } from "@/components/ui/Badge";
import type { AgendaItem } from "@/lib/content";
import { sessionAgendaImageAlt, SITE_IMAGE_ALT } from "@/lib/image-alt";
import {
  Brain,
  Clock,
  Handshake,
  Laptop,
  Map,
  Sparkles,
  Video,
} from "lucide-react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";

interface SessionAgendaProps {
  agenda: AgendaItem[];
}

const segmentIcons: LucideIcon[] = [Handshake, Brain, Sparkles, Laptop, Map];

export function SessionAgenda({ agenda }: SessionAgendaProps) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/40 via-background to-background" />
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-teal/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-start lg:gap-16">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-medium uppercase tracking-wider text-teal">Session outline</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl lg:text-4xl">
              2-hour session agenda
            </h2>
            <p className="mt-4 max-w-md text-text-secondary leading-relaxed">
              Every segment is structured for understanding — with live interaction and room for your
              questions.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge className="border-teal/20 bg-teal/10 text-teal">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                2 hours total
              </Badge>
              <Badge className="border-border bg-card text-foreground">
                <Video className="mr-1.5 h-3.5 w-3.5 text-teal" />
                Live & interactive
              </Badge>
              <Badge className="border-border bg-card text-foreground">
                {agenda.length} segments
              </Badge>
            </div>

            <div className="relative mt-8 hidden overflow-hidden rounded-2xl border border-border shadow-lg lg:block">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/images/workshop.jpg"
                  alt={SITE_IMAGE_ALT.freeSessionWorkshop}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-sm font-medium text-foreground">Structured like a premium workshop</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Clear pacing · Hands-on moments · Personalized wrap-up
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute left-[1.65rem] top-4 bottom-4 w-px bg-gradient-to-b from-teal/60 via-teal/25 to-transparent md:left-[1.85rem]"
              aria-hidden="true"
            />

            <ol className="space-y-5">
              {agenda.map((item, index) => {
                const Icon = segmentIcons[index % segmentIcons.length];
                const isLast = index === agenda.length - 1;

                return (
                  <li key={item.title} className="relative">
                    <div className="flex gap-4 md:gap-5">
                      <div className="relative z-10 flex shrink-0 flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal/25 bg-card shadow-sm md:h-14 md:w-14">
                          <Icon className="h-5 w-5 text-teal md:h-6 md:w-6" />
                        </div>
                        {!isLast && (
                          <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-teal/80">
                            {item.time}
                          </span>
                        )}
                      </div>

                      <article className="group min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-teal/30 hover:shadow-md">
                        <div className="flex flex-col sm:flex-row">
                          {item.image && (
                            <div className="relative h-36 shrink-0 sm:h-auto sm:w-36 md:w-44">
                              <Image
                                src={item.image}
                                alt={sessionAgendaImageAlt(item.title)}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, 176px"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20 sm:bg-gradient-to-l sm:from-transparent sm:to-card/30" />
                            </div>
                          )}

                          <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-semibold text-text-secondary">
                                {index + 1}
                              </span>
                              <span className="text-xs font-medium text-teal">{item.time}</span>
                              {item.duration && (
                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                                  {item.duration}
                                </span>
                              )}
                            </div>

                            <h3 className="mt-3 text-base font-semibold text-foreground md:text-lg">
                              {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </article>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-8 rounded-2xl border border-dashed border-teal/30 bg-teal/5 px-5 py-4 text-sm text-text-secondary">
              <span className="font-medium text-foreground">Tip:</span> Pick your audience when
              booking — we tailor examples for students, engineers, and professionals.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}