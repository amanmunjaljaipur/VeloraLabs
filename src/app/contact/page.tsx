import { ContactExpectations, ContactReassurance } from "@/components/sections/ContactFaq";
import { ContactHero } from "@/components/sections/ContactHero";
import { WaysToConnect } from "@/components/sections/WaysToConnect";
import { ContactForm } from "./ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Verlin Labs for free session inquiries, corporate programs, partnerships, and general questions.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <WaysToConnect />
      <section className="border-t border-border bg-muted/10 py-16 md:py-24">
        <ContactForm />
      </section>
      <ContactExpectations />
      <ContactReassurance />
    </>
  );
}