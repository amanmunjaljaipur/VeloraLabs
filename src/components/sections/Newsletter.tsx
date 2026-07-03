"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { NEWSLETTER_ILLUSTRATION } from "@/lib/home-content";
import { submitForm } from "@/lib/submit-to-sheets";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface NewsletterProps {
  title: string;
  description: string;
  cta: string;
}

export function Newsletter({ title, description, cta }: NewsletterProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast("Please enter a valid email address.", "error");
      return;
    }
    setSubmitting(true);
    const result = await submitForm({
      type: "newsletter",
      email,
      source: "Homepage Newsletter",
    });
    setSubmitting(false);

    if (result.ok) {
      setSuccess(true);
      setEmail("");
    } else {
      toast("Something went wrong. Please try again.", "error");
    }
  };

  return (
    <section id="newsletter" className="relative overflow-hidden py-16 md:py-24">
      <div className="hero-orb hero-orb-teal left-1/4 top-0 h-48 w-48 opacity-40" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
      <div className="container-verlin relative">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative mx-auto mb-5 h-16 w-16 overflow-hidden rounded-2xl border border-accent-teal/15 bg-gradient-to-br from-accent-teal/5 to-sky-50/40 shadow-sm">
            <Image
              src={NEWSLETTER_ILLUSTRATION.src}
              alt={NEWSLETTER_ILLUSTRATION.alt}
              fill
              className="object-contain p-2"
              sizes="64px"
            />
          </div>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle mx-auto">{description}</p>

          {success ? (
            <div className="mt-8 rounded-2xl border border-accent-teal/20 bg-accent-teal/5 px-6 py-8">
              <CheckCircle2 className="mx-auto h-10 w-10 text-accent-teal" />
              <p className="mt-3 font-medium text-foreground">You&apos;re subscribed!</p>
              <p className="mt-1 text-sm text-text-secondary">
                Welcome to the Verlin community — check your inbox soon.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
                aria-label="Email address"
              />
              <Button type="submit" loading={submitting} variant="cta" className="shadow-glow-amber">
                {cta}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}