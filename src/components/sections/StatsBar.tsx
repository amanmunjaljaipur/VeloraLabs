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
    <section className="border-b border-border bg-[var(--canvas)] py-10 md:py-12">
      <div className="container-verlin">
        <MotionStagger className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-8">
          {stats.map((stat) => (
            <MotionStaggerItem key={stat.label}>
              <div className="text-center">
                <p className="font-[family-name:var(--font-display)] text-[2rem] font-medium tracking-tight text-teal md:text-[2.5rem]">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm text-text-secondary">{stat.label}</p>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}