import { FaqClient } from "./FaqClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about Verlin Labs — free sessions, programs, learning experience, teams, and logistics.",
};

export default function FaqPage() {
  return (
    <>
      <section className="border-b border-border py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-accent-teal">Help center</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-text-secondary">
            Everything you need to know about learning with Verlin Labs
          </p>
        </div>
      </section>

      <FaqClient />
    </>
  );
}