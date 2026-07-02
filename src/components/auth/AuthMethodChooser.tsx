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
  footer?: React.ReactNode;
}

export function AuthMethodChooser({
  title,
  subtitle,
  googleLabel,
  manualLabel,
  callbackUrl,
  onManual,
  footer,
}: AuthMethodChooserProps) {
  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{subtitle}</p>

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