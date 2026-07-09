"use client";

import { LegalDocumentModal } from "@/components/legal/LegalDocumentModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { signUpSchema } from "@/lib/auth-validation";
import type { PublicLegalDocument } from "@/lib/legal/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [terms, setTerms] = useState<PublicLegalDocument | null>(null);
  const [privacy, setPrivacy] = useState<PublicLegalDocument | null>(null);
  const [modalType, setModalType] = useState<"terms" | "privacy" | null>(null);
  const [loadingLegal, setLoadingLegal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { acceptTerms: undefined },
  });

  useEffect(() => {
    fetch("/api/legal")
      .then((r) => r.json())
      .then((data: { terms: PublicLegalDocument; privacy: PublicLegalDocument }) => {
        setTerms(data.terms);
        setPrivacy(data.privacy);
      })
      .catch(() => {});
  }, []);

  async function openModal(type: "terms" | "privacy") {
    setModalType(type);
    if ((type === "terms" && terms) || (type === "privacy" && privacy)) return;
    setLoadingLegal(true);
    try {
      const res = await fetch(`/api/legal?type=${type}`);
      const doc = (await res.json()) as PublicLegalDocument;
      if (type === "terms") setTerms(doc);
      else setPrivacy(doc);
    } finally {
      setLoadingLegal(false);
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    setFormError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = (await res.json()) as {
      error?: string;
      requiresVerification?: boolean;
      email?: string;
    };

    if (!res.ok) {
      setFormError(payload.error || "Could not create account. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);

    const verifyEmail = payload.email ?? data.email;
    router.push(
      `/signup/verify-email?email=${encodeURIComponent(verifyEmail)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  });

  return (
    <>
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
          Fill in your details to get started. We&apos;ll email you a verification link and code to
          finish sign-up. After that, an admin will assign your learner track.
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
              <button
                type="button"
                className="font-medium text-accent-teal hover:underline"
                onClick={() => openModal("terms")}
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                className="font-medium text-accent-teal hover:underline"
                onClick={() => openModal("privacy")}
              >
                Privacy Policy
              </button>
              {terms && privacy && (
                <span className="mt-1 block text-xs text-text-muted">
                  (Terms v{terms.version}, Privacy v{privacy.version})
                </span>
              )}
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

          <p className="text-center text-xs text-text-muted">
            You can also read the full documents on our{" "}
            <Link href="/terms" className="text-accent-teal hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-accent-teal hover:underline">
              Privacy
            </Link>{" "}
            pages.
          </p>
        </form>
      </Card>

      <LegalDocumentModal
        open={modalType === "terms"}
        onClose={() => setModalType(null)}
        document={terms}
        loading={loadingLegal && modalType === "terms"}
      />
      <LegalDocumentModal
        open={modalType === "privacy"}
        onClose={() => setModalType(null)}
        document={privacy}
        loading={loadingLegal && modalType === "privacy"}
      />
    </>
  );
}