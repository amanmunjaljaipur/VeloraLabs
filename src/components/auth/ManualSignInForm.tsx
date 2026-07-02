"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { signInSchema } from "@/lib/auth-validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type FormData = z.infer<typeof signInSchema>;

interface ManualSignInFormProps {
  callbackUrl: string;
  onBack: () => void;
}

export function ManualSignInForm({ callbackUrl, onBack }: ManualSignInFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { remember: true },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    setAuthError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      remember: String(data.remember ?? false),
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setAuthError(
        result.error === "rate_limited"
          ? "Too many sign-in attempts. Please wait a few minutes and try again."
          : "Invalid email or password. Please try again."
      );
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  });

  return (
    <Card className="w-full max-w-md">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-2xl font-semibold text-foreground">Sign in with email</h1>
      <p className="mt-2 text-sm text-text-secondary">Enter your account credentials to continue.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-teal focus:ring-teal/30"
              {...register("remember")}
            />
            Remember me
          </label>
          <Link
            href="/login/forgot-password"
            className="text-sm font-medium text-teal hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {authError && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{authError}</p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Sign in
        </Button>
      </form>
    </Card>
  );
}