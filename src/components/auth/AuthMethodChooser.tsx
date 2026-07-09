"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Mail } from "lucide-react";

interface AuthMethodChooserProps {
  title: string;
  subtitle: string;
  googleLabel: string;
  manualLabel: string;
  callbackUrl: string;
  onManual: () => void;
  authError?: string | null;
  authSuccess?: string | null;
  footer?: React.ReactNode;
}

export function AuthMethodChooser({
  title,
  subtitle,
  googleLabel,
  manualLabel,
  callbackUrl,
  onManual,
  authError,
  authSuccess,
  footer,
}: AuthMethodChooserProps) {
  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{subtitle}</p>

      {authSuccess && (
        <p className="mt-4 rounded-xl border border-teal/20 bg-teal/10 px-4 py-3 text-sm text-teal">
          {authSuccess}
        </p>
      )}

      {authError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
        >
          {authError}
        </p>
      )}

      <div className="mt-8 space-y-3">
        <GoogleAuthButton label={googleLabel} callbackUrl={callbackUrl} className="w-full" />
        <Button size="lg" variant="secondary" className="w-full" onClick={onManual}>
          <Mail className="h-5 w-5" />
          {manualLabel}
        </Button>
      </div>

      {footer && <div className="mt-6 text-center text-sm text-text-secondary">{footer}</div>}
    </Card>
  );
}