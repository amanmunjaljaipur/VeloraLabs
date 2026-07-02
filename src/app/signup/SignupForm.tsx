"use client";

import { AuthMethodChooser } from "@/components/auth/AuthMethodChooser";
import { ManualSignUpForm } from "@/components/auth/ManualSignUpForm";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type AuthMethod = "choose" | "manual";

export function SignupForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [method, setMethod] = useState<AuthMethod>("choose");

  if (method === "manual") {
    return <ManualSignUpForm callbackUrl={callbackUrl} onBack={() => setMethod("choose")} />;
  }

  return (
    <AuthMethodChooser
      title="Create your account"
      subtitle="Join Verlin Labs to book free sessions, access courses, and track your progress."
      googleLabel="Sign up with Google"
      manualLabel="Sign up with email"
      callbackUrl={callbackUrl}
      onManual={() => setMethod("manual")}
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-teal hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    />
  );
}