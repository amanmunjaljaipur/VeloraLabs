"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { submitForm } from "@/lib/submit-to-sheets";
import { motion } from "framer-motion";
import { CheckCircle2, Mail } from "lucide-react";
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
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url(/images/collaboration.jpg)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10 text-teal">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">{title}</h2>
          <p className="mt-4 text-text-secondary leading-relaxed">{description}</p>

          {success ? (
            <div className="mt-8 rounded-2xl border border-teal/20 bg-teal/5 px-6 py-8">
              <CheckCircle2 className="mx-auto h-10 w-10 text-teal" />
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
              <Button type="submit" loading={submitting}>
                {cta}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}