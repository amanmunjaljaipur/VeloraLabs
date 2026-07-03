import { PageHeader } from "@/components/layout/PageHeader";
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
      <PageHeader
        eyebrow="Help center"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about learning with Verlin Labs"
        align="center"
        compact
      />

      <FaqClient />
    </>
  );
}