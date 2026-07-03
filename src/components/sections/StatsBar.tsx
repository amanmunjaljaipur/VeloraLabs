"use client";

import { MotionStagger, MotionStaggerItem } from "@/components/ui/MotionReveal";

const stats = [
  { value: "3", label: "Learning tracks" },
  { value: "16", label: "Max program days" },
  { value: "2hr", label: "Free intro session" },
  { value: "100%", label: "Clarity-first approach" },
];

export function StatsBar() {
  return (
    <section className="border-y border-border/80 bg-muted/30 py-12">
      <div className="container-verlin">
        <MotionStagger className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <MotionStaggerItem key={stat.label}>
              <div className="group text-center transition-transform duration-300 hover:-translate-y-0.5">
                <p className="text-3xl font-semibold text-teal transition-colors duration-300 group-hover:text-accent-teal md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}