"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { LinkedInAuthButton } from "@/components/auth/LinkedInAuthButton";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const AUDIENCE_OPTIONS: { value: "students" | "engineers" | "professionals"; label: string }[] = [
  { value: "students", label: "Student / parent" },
  { value: "engineers", label: "Engineer" },
  { value: "professionals", label: "Product manager / leader" },
];

export function TestimonialSubmitForm() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState("");
  const [audience, setAudience] = useState<"students" | "engineers" | "professionals">("students");
  const [quote, setQuote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (quote.trim().length < 20) {
      setError("Tell us a bit more - at least 20 characters.");
      return;
    }
    if (!role.trim()) {
      setError("Add your title or role.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/testimonials/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, role, audience }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card variant="glass" className="mx-auto max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-teal" aria-hidden="true" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Thank you</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Your testimonial is in for review. It will appear on this page once approved.
        </p>
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-text-secondary" aria-hidden="true" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Card variant="glass" className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground">Share your experience</h3>
        <p className="text-sm text-text-secondary">
          Sign in with LinkedIn to bring in your name and photo automatically, or continue with
          Google.
        </p>
        <div className="space-y-3">
          <LinkedInAuthButton callbackUrl="/testimonials" />
          <GoogleAuthButton callbackUrl="/testimonials" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="mx-auto max-w-xl p-8">
      <div className="mb-6 flex items-center gap-3">
        {session.user.image ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-accent-teal/25">
            <OptimizedImage
              src={session.user.image}
              alt={session.user.name || "Your profile photo"}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-accent-teal text-sm font-semibold text-white">
            {(session.user.name || session.user.email || "?").charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground">{session.user.name}</p>
          <p className="text-xs text-text-secondary">
            {session.user.authProvider === "linkedin" ? "Signed in with LinkedIn" : "Signed in"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="testimonial-role" className="mb-1 block text-sm font-medium text-foreground">
            Your title or role
          </label>
          <input
            id="testimonial-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Product Manager"
            maxLength={100}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-teal"
          />
        </div>

        <div>
          <label htmlFor="testimonial-audience" className="mb-1 block text-sm font-medium text-foreground">
            Which track fits you best
          </label>
          <select
            id="testimonial-audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-teal"
          >
            {AUDIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="testimonial-quote" className="mb-1 block text-sm font-medium text-foreground">
            Your testimonial
          </label>
          <textarea
            id="testimonial-quote"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={5}
            maxLength={800}
            placeholder="Share what changed for you..."
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-teal"
          />
          <p className="mt-1 text-right text-xs text-text-secondary">{quote.length}/800</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" variant="cta" size="lg" className="w-full" loading={submitting}>
          Submit for review
        </Button>
      </form>
    </Card>
  );
}
