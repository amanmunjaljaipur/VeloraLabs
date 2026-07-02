import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "./ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Verlin Labs.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact Us"
        subtitle="Questions about the free session, full program, or partnerships? We'd love to hear from you."
      />
      <section className="pb-16 md:pb-24">
        <ContactForm />
      </section>
    </>
  );
}