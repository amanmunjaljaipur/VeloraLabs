import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Briefcase, Building2, Calendar, Handshake, Mail, Mic2 } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface ConnectOption {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  cta: string;
  external?: boolean;
}

const options: ConnectOption[] = [
  {
    title: "Book a Free 2-Hour Session",
    description:
      "Experience how we teach - live, structured, and tailored to your background. No payment required.",
    icon: Calendar,
    href: "/free-session",
    cta: "Reserve your spot",
  },
  {
    title: "Corporate / Team Workshops",
    description:
      "Clarity-first AI literacy for teams - custom pacing, practical frameworks, and follow-up resources.",
    icon: Building2,
    href: "/corporate",
    cta: "View team workshops",
  },
  {
    title: "Partnerships & Collaborations",
    description:
      "Content partnerships, co-branded programs, or community collaborations that align with our mission.",
    icon: Handshake,
    href: "#contact-form",
    cta: "Start a conversation",
  },
  {
    title: "General Inquiries",
    description:
      "Questions about programs, library content, enrollment, or anything else - we are here to help.",
    icon: Mail,
    href: "#contact-form",
    cta: "Ask a question",
  },
  {
    title: "Media / Press",
    description:
      "Interview requests, speaking opportunities, or press materials about Verlin Labs and our approach.",
    icon: Mic2,
    href: "#contact-form",
    cta: "Media inquiry",
  },
  {
    title: "Professional courses",
    description:
      "Product managers and working professionals - learn about the full track, capstone, and enrollment.",
    icon: Briefcase,
    href: "/courses",
    cta: "View courses",
  },
];

export function WaysToConnect() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">Ways to connect</h2>
          <p className="mt-3 text-text-secondary leading-relaxed">
            Choose the path that fits your goal - or use the form below and we&apos;ll route your
            message to the right person.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.title} hover className="flex h-full flex-col p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{option.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                  {option.description}
                </p>
                <Link href={option.href} className="mt-5">
                  <Button variant="secondary" size="sm">
                    {option.cta}
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}