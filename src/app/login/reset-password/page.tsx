"use client";

import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { resetPasswordSchema } from "@/lib/auth-validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type FormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(payload.error || "Could not reset password. Please try again.");
        return;
      }

      setCompleted(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Could not reset password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  });

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-foreground">Invalid reset link</h1>
        <p className="mt-2 text-sm text-text-secondary">
          This password reset link is missing or invalid. Request a new one from the sign-in page.
        </p>
        <Link
          href="/login/forgot-password"
          className="mt-6 inline-flex text-sm font-medium text-accent-teal hover:underline"
        >
          Request a new reset link
        </Link>
      </Card>
    );
  }

  if (completed) {
    return (
      <Card className="w-full max-w-md">
        <div className="flex items-start gap-3 rounded-xl bg-teal/10 px-4 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-teal" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Password updated</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Your password has been changed. Redirecting you to sign in…
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <Link
        href="/login"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>

      <h1 className="text-2xl font-semibold text-foreground">Choose a new password</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Enter a strong password for your Verlin Labs account.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <input type="hidden" {...register("token")} />

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <PasswordInput
          label="New password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Update password
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Suspense
        fallback={
          <Card className="w-full max-w-md p-6 text-sm text-text-secondary">Loading…</Card>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}