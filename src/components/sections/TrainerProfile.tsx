import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { TrainerProfile as TrainerProfileData } from "@/lib/content";
import { CheckCircle2 } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import Link from "next/link";

interface TrainerProfileProps {
  trainer: TrainerProfileData;
}

export function TrainerProfile({ trainer }: TrainerProfileProps) {
  return (
    <section className="section-y section-divider bg-muted/20">
      <div className="container-verlin">
        <SectionHeader
          eyebrow="About the instructors"
          title="Meet Aman Munjal — founder & lead instructor"
          subtitle="Learn directly from the educator who designed Verlin Labs' mental-model curriculum across every track."
          className="mb-12 md:mb-16"
        />

        <div className="card-verlin mx-auto max-w-5xl overflow-hidden p-0 shadow-md">
          <div className="grid lg:grid-cols-[minmax(280px,340px)_1fr]">
            <div className="relative bg-gradient-to-br from-accent-teal/10 via-background to-sky-50/40 p-8 lg:p-10">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl border border-accent-teal/20 shadow-lg">
                <OptimizedImage
                  src={trainer.image}
                  alt={trainer.imageAlt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 80vw, 340px"
                />
              </div>
              <div className="mt-6 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-foreground">{trainer.name}</h3>
                <p className="mt-1 text-sm font-semibold text-accent-teal">{trainer.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{trainer.tagline}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
              <div className="space-y-4">
                {trainer.bio.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-text-secondary">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Areas of expertise
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trainer.expertise.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-accent-teal/20 bg-accent-teal/5 px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <ul className="mt-8 space-y-2.5">
                {trainer.credentials.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={trainer.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-accent-teal/40 hover:text-accent-teal"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  Connect on LinkedIn
                </Link>
                <ButtonLink href="/free-session" variant="cta" size="md">
                  Book a free session with Aman
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}