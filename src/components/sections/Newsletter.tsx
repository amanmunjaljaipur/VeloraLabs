"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { submitForm } from "@/lib/submit-to-sheets";
import { useState } from "react";

interface NewsletterProps {
  title: string;
  description: string;
  cta: string;
}

export function Newsletter({ title, description, cta }: NewsletterProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast("Please enter a valid email address.", "error");
      return;
    }
    await submitForm({ type: "newsletter", email });
    toast("You're subscribed! Welcome to the Verlin community.", "success");
    setEmail("");
  };

  return (
    <section id="newsletter" className="relative py-16 md:py-24 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url(/images/collaboration.jpg)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">{title}</h2>
          <p className="mt-4 text-text-secondary leading-relaxed">{description}</p>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">{cta}</Button>
          </form>
        </div>
      </div>
    </section>
  );
}