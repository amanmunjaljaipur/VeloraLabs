import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getLeadTrainer } from "@/lib/content";
import { CheckCircle2 } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import Link from "next/link";

interface InstructorsSectionProps {
  compact?: boolean;
  className?: string;
}

export function InstructorsSection({ compact = false, className }: InstructorsSectionProps) {
  const trainer = getLeadTrainer();

  return (
    <section className={className ?? "section-y bg-muted/20"}>
      <div className="container-verlin">
        <SectionHeader
          eyebrow="About the instructors"
          title="Learn from Aman Munjal, founder of Verlin Labs"
          subtitle="Live instruction, curriculum design, and corporate workshops - one educator across every track."
          className="mb-10 md:mb-12"
        />

        <div className="card-verlin mx-auto grid max-w-5xl gap-8 overflow-hidden p-6 md:grid-cols-[220px_1fr] md:p-8 lg:grid-cols-[260px_1fr]">
          <div className="mx-auto w-full max-w-[260px] md:mx-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-accent-teal/20 shadow-md">
              <OptimizedImage
                src={trainer.image}
                alt={trainer.imageAlt}
                fill
                className="object-cover object-top"
                sizes="260px"
              />
            </div>
            <div className="mt-4 text-center md:text-left">
              <p className="text-lg font-bold text-foreground">{trainer.name}</p>
              <p className="text-sm font-semibold text-accent-teal">{trainer.title}</p>
            </div>
          </div>

          <div>
            <p className="text-base leading-relaxed text-text-secondary">{trainer.bio[0]}</p>
            {!compact && trainer.bio[1] && (
              <p className="mt-4 text-base leading-relaxed text-text-secondary">{trainer.bio[1]}</p>
            )}

            <ul className="mt-6 space-y-2">
              {trainer.credentials.slice(0, compact ? 2 : 4).map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/about" variant="secondary" size="md">
                Full instructor bio
              </ButtonLink>
              <Link
                href={trainer.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-teal hover:underline"
              >
                LinkedIn profile →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}