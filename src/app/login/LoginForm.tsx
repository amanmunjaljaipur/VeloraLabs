"use client";

import { AuthMethodChooser } from "@/components/auth/AuthMethodChooser";
import { ManualSignInForm } from "@/components/auth/ManualSignInForm";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type AuthMethod = "choose" | "manual";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Sign-in is temporarily unavailable. Please try again in a moment.",
  AccessDenied: "Access was denied. Please use an authorized Google account.",
  Verification: "This sign-in link has expired. Please try again.",
  OAuthSignin: "Could not start Google sign-in. Please try again.",
  OAuthCallback:
    "Google sign-in could not be completed. Clear cookies for verlinlabs.com and try again.",
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Use that method instead.",
  CallbackRouteError: "Sign-in failed on return from Google. Please try again.",
  Default: "Sign-in failed. Please try again.",
};

function resolveAuthError(code: string | null): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authError = resolveAuthError(searchParams.get("error"));
  const verified = searchParams.get("verified") === "1";
  const verifiedEmail = searchParams.get("email");
  const [method, setMethod] = useState<AuthMethod>("choose");

  if (method === "manual") {
    return <ManualSignInForm callbackUrl={callbackUrl} onBack={() => setMethod("choose")} />;
  }

  return (
    <AuthMethodChooser
      title="Welcome back"
      subtitle="Sign in to book sessions, track your learning, and access your dashboard."
      googleLabel="Sign in with Google"
      manualLabel="Sign in with email"
      callbackUrl={callbackUrl}
      onManual={() => setMethod("manual")}
      authSuccess={
        verified
          ? `Email verified${verifiedEmail ? ` for ${verifiedEmail}` : ""}. You can sign in now.`
          : null
      }
      authError={verified ? null : authError}
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-teal hover:underline"
          >
            Sign up
          </Link>
        </p>
      }
    />
  );
}