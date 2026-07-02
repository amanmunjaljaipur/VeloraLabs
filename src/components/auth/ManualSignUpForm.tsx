"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { signUpSchema } from "@/lib/auth-validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type FormData = z.infer<typeof signUpSchema>;

interface ManualSignUpFormProps {
  callbackUrl: string;
  onBack: () => void;
}

export function ManualSignUpForm({ callbackUrl, onBack }: ManualSignUpFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { acceptTerms: undefined },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    setFormError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = (await res.json()) as { error?: string };

    if (!res.ok) {
      setFormError(payload.error || "Could not create account. Please try again.");
      setSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      remember: "true",
      redirect: false,
    });

    setSubmitting(false);

    if (signInResult?.error) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
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

      <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Fill in your details to get started with Verlin Labs.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="First name"
            autoComplete="given-name"
            placeholder="Aman"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            placeholder="Munjal"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <label className="flex items-start gap-2.5 text-sm text-text-secondary">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border text-teal focus:ring-teal/30"
            {...register("acceptTerms")}
          />
          <span>
            I agree to the{" "}
            <Link href="/about" className="font-medium text-teal hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/contact" className="font-medium text-teal hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.acceptTerms?.message && (
          <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
        )}

        {formError && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{formError}</p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
    </Card>
  );
}