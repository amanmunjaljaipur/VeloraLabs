import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CalendarCheck, ClipboardCheck, Rocket, UserPlus } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    step: "1",
    title: "Create your account",
    body: "Sign up in under a minute - no payment required to create an account.",
    href: "/signup",
    cta: "Sign up",
  },
  {
    icon: CalendarCheck,
    step: "2",
    title: "Book your free trial",
    body: "A live 2-hour session with a real instructor - decide if it's right for you before paying anything.",
    href: "/free-session",
    cta: "Book free session",
  },
  {
    icon: ClipboardCheck,
    step: "3",
    title: "Choose your plan",
    body: "Student, Engineer, PM, or Enterprise - pick the track that matches where you are.",
    href: "/pricing",
    cta: "View plans",
  },
  {
    icon: Rocket,
    step: "4",
    title: "Enroll and start learning",
    body: "Get access to your live program, session recordings, and progress dashboard.",
    href: "/contact",
    cta: "Talk to us",
  },
];

/**
 * The explicit sign-up -> trial -> plan -> enroll funnel, reused across
 * pricing/products so the path to purchase is always one glance away.
 */
export function ConversionJourney() {
  return (
    <section className="section-y">
      <div className="container-verlin">
        <SectionHeader
          eyebrow="Your journey"
          title="From first click to enrolled learner"
          subtitle="Four steps - no dark patterns, no forced payment before you've met your instructor."
          className="mb-12"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative flex flex-col items-start">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-teal/10 text-teal">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="mt-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Step {item.step}
                </span>
                <h3 className="mt-1 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                  {item.body}
                </p>
                <ButtonLink href={item.href} variant="secondary" size="sm" className="mt-4">
                  {item.cta}
                </ButtonLink>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
