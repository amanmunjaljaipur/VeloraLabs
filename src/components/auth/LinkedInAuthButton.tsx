"use client";

import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";

interface LinkedInAuthButtonProps {
  label?: string;
  callbackUrl?: string;
  className?: string;
}

/**
 * Mirrors GoogleAuthButton.tsx. Checks NextAuth's own /api/auth/providers
 * endpoint (rather than an env var, which is not readable client-side) so
 * this button quietly disables itself with a clear message in any
 * environment where a LinkedIn developer app has not been configured yet -
 * instead of taking the user to a broken OAuth screen.
 */
export function LinkedInAuthButton({
  label = "Continue with LinkedIn",
  callbackUrl = "/",
  className,
}: LinkedInAuthButtonProps) {
  const [csrfToken, setCsrfToken] = useState("");
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [resolvedCallback, setResolvedCallback] = useState(callbackUrl);

  useEffect(() => {
    if (callbackUrl.startsWith("http")) {
      setResolvedCallback(callbackUrl);
      return;
    }
    const path = callbackUrl.startsWith("/") ? callbackUrl : `/${callbackUrl}`;
    setResolvedCallback(`${window.location.origin}${path}`);
  }, [callbackUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadCsrfAndProviders() {
      try {
        const [csrfRes, providersRes] = await Promise.all([
          fetch("/api/auth/csrf", { credentials: "same-origin" }),
          fetch("/api/auth/providers", { credentials: "same-origin" }),
        ]);
        if (!cancelled && csrfRes.ok) {
          const data = (await csrfRes.json()) as { csrfToken?: string };
          if (data.csrfToken) {
            setCsrfToken(data.csrfToken);
            setReady(true);
          }
        }
        if (!cancelled && providersRes.ok) {
          const data = (await providersRes.json()) as Record<string, unknown>;
          setConfigured(Boolean(data.linkedin));
        }
      } catch {
        // Button stays disabled until this resolves.
      }
    }

    void loadCsrfAndProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  if (configured === false) {
    return (
      <p className={`text-xs text-text-secondary ${className ?? ""}`}>
        LinkedIn sign-in is not connected yet.
      </p>
    );
  }

  return (
    <form action="/api/auth/signin/linkedin" method="POST" className={className}>
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value={resolvedCallback} />
      <Button type="submit" size="lg" variant="secondary" className="w-full" disabled={!ready}>
        <LinkedInIcon />
        {label}
      </Button>
    </form>
  );
}

export function LinkedInIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"
      />
    </svg>
  );
}
