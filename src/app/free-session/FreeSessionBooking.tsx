import { BookingSection } from "./BookingSection";
import { Card } from "@/components/ui/Card";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

const highlights = [
  "Tailored to your background",
  "Live mental model walkthrough",
  "Hands-on exercise included",
  "Resource pack after session",
];

export function FreeSessionBooking() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <p className="text-sm font-medium text-teal">Book in under 2 minutes</p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">Reserve your free session</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Choose a date, pick a time slot, and enter your details. No payment required.
            </p>
            <div className="mt-8">
              <BookingSection />
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <Card>
              <h3 className="font-semibold text-foreground">Included in every session</h3>
              <ul className="mt-4 space-y-3">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <div className="relative hidden overflow-hidden rounded-2xl border border-border lg:block">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/images/workshop.jpg"
                  alt="Live online learning workshop"
                  fill
                  className="object-cover"
                  sizes="300px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-teal/80 via-deep-teal/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm font-medium text-white">Live, interactive, and tailored to you</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}