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
    <section className="border-b border-border bg-[var(--bg-parchment)]">
      <div className="container-verlin py-12 md:py-14">
        <MotionStagger className="grid-editorial grid-cols-2 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <MotionStaggerItem key={stat.label}>
              <div className="px-2 py-2">
                <p className="font-[family-name:var(--font-display)] text-[2rem] font-medium tracking-tight text-teal md:text-[2.375rem]">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm leading-snug text-text-secondary">
                  {stat.label}
                </p>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}
