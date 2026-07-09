"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorCode = searchParams.get("error");

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorCode === "invalid_token") {
      setError("This verification link is invalid or has expired. Enter your code or request a new email.");
    } else if (errorCode === "missing_token") {
      setError("Verification link is incomplete. Enter your code below or request a new email.");
    } else if (errorCode === "verify_failed") {
      setError("We could not complete verification. Try entering your code or request a new email.");
    }
  }, [errorCode]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token?.trim()) return;

    let cancelled = false;
    (async () => {
      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.trim() }),
        });
        const data = (await res.json()) as { error?: string; email?: string };

        if (cancelled) return;

        if (!res.ok) {
          setError(data.error || "Verification link is invalid or expired.");
          setSubmitting(false);
          return;
        }

        const verifiedEmail = data.email ?? email;
        router.replace(
          `/login?verified=1&email=${encodeURIComponent(verifiedEmail)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
      } catch {
        if (!cancelled) {
          setError("Verification link could not be processed. Enter your code below.");
          setSubmitting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, email, callbackUrl]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as { error?: string; success?: boolean };

      if (!res.ok) {
        setError(data.error || "Verification failed. Please try again.");
        return;
      }

      router.push(
        `/login?verified=1&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
      );
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error || "Could not resend verification email.");
        return;
      }

      setMessage(data.message || "If an unverified account exists, a new email has been sent.");
    } catch {
      setError("Could not resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
      <Card className="w-full p-6 md:p-8">
        <Link
          href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign up
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
            <MailCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Verify your email</h1>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              We sent a verification link and 6-digit code to your inbox. Confirm your email to
              finish creating your account. Google sign-in does not require this step.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyCode} className="mt-8 space-y-5">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Verification code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />

          {error && (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>
          )}
          {message && (
            <p className="rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal">{message}</p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Verify and continue
          </Button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm text-text-secondary">
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resending || !email.trim()}
            className="font-medium text-teal hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>
          <p>
            Already verified?{" "}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-teal hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}