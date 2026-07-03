import { Accordion } from "@/components/ui/Accordion";
import { Card } from "@/components/ui/Card";
import { Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    question: "How quickly will I get a reply?",
    answer:
      "We aim to respond within 24–48 hours on business days. Urgent free-session scheduling questions are usually faster — often the same day.",
  },
  {
    question: "Can I book a session directly?",
    answer:
      "Yes. For the fastest path to a free 2-hour session, use our booking page at /free-session. The contact form is best for custom questions, teams, or partnerships.",
  },
  {
    question: "Do you offer corporate or team training?",
    answer:
      "Yes. We run clarity-first workshops for teams — tailored examples, live Q&A, and follow-up resources. Mention your team size and goals in the form and we'll share options.",
  },
  {
    question: "Is there a physical office I can visit?",
    answer:
      "Verlin Labs programs are delivered online. Sessions use video conferencing so learners can join from anywhere with a stable connection.",
  },
  {
    question: "Will you try to sell me a paid program?",
    answer:
      "No pressure. We'll answer your question honestly. Paid enrollment is discussed only if it's genuinely relevant to your goals — many people use only the free session and library resources.",
  },
  {
    question: "What should I include in my message?",
    answer:
      "Your background, what you're trying to learn or solve, team size (if applicable), and any timeline. The more context you share, the more useful our reply will be.",
  },
];

export function ContactExpectations() {
  return (
    <section className="border-t border-border bg-muted/20 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-semibold text-foreground md:text-3xl">What to expect</h2>
            <p className="mt-4 text-text-secondary leading-relaxed">
              We read every message personally. You&apos;ll get a clear, human reply — not an
              auto-generated funnel.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                {
                  icon: Clock,
                  title: "Response within 24–48 hours",
                  text: "Business days, India time. Session booking links are often faster.",
                },
                {
                  icon: Users,
                  title: "Include context up front",
                  text: "Role, goals, and team size help us tailor the reply on the first message.",
                },
                {
                  icon: MapPin,
                  title: "No obligation",
                  text: "Asking a question doesn't enroll you in anything. Explore at your own pace.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm text-text-secondary">{item.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <Card className="p-6 md:p-8">
            <h3 className="text-lg font-semibold text-foreground">Contact FAQ</h3>
            <p className="mt-2 text-sm text-text-secondary">
              More answers about programs, sessions, and learning — on our{" "}
              <Link href="/faq" className="font-medium text-accent-teal hover:underline">
                full FAQ page
              </Link>
              .
            </p>
            <div className="mt-6">
              <Accordion items={faqs} />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

export function ContactReassurance() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
        <p className="text-lg font-medium text-foreground">
          Verlin Labs exists to make AI and technology understandable — not overwhelming.
        </p>
        <p className="mt-3 text-text-secondary leading-relaxed">
          However you reach out, you&apos;ll be met with clarity, respect, and practical guidance.
          We look forward to hearing from you.
        </p>
      </div>
    </section>
  );
}