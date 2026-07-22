"use client";

import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { submitForm } from "@/lib/submit-to-sheets";
import { motion } from "framer-motion";
import { SuccessBanner } from "@/components/ui/SuccessBanner";
import { useState } from "react";

interface NewsletterProps {
  title: string;
  description: string;
  cta: string;
  /** When true, CTA links to /newsletter instead of showing an inline signup form. */
  linkToPage?: boolean;
  /** Stored with the subscriber record for attribution. */
  subscribeSource?: string;
}

export function Newsletter({
  title,
  description,
  cta,
  linkToPage = false,
  subscribeSource = "Homepage Newsletter",
}: NewsletterProps) {
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
      source: subscribeSource,
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
    <section id="newsletter" className="section-y section-divider relative scroll-mt-20 overflow-hidden">
      <div className="hero-orb hero-orb-teal left-1/4 top-0 h-48 w-48 opacity-40" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
      <div className="container-verlin relative">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle mx-auto">{description}</p>

          {linkToPage ? (
            <div className="mt-8">
              <ButtonLink href="/newsletter" variant="cta" size="lg" className="shadow-glow-amber">
                {cta}
              </ButtonLink>
            </div>
          ) : success ? (
            <SuccessBanner
              className="mt-8"
              title="You are subscribed!"
              description="You will receive our Sunday newsletter when the next edition is published."
            />
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