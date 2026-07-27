"use client";

import { GoogleBrandButton, GoogleIcon } from "@/components/auth/GoogleBrandButton";
import { useEffect, useState } from "react";

export { GoogleIcon };

interface GoogleAuthButtonProps {
  label?: string;
  callbackUrl?: string;
  className?: string;
}

export function GoogleAuthButton({
  label = "Continue with Google",
  callbackUrl = "/",
  className,
}: GoogleAuthButtonProps) {
  const [csrfToken, setCsrfToken] = useState("");
  const [ready, setReady] = useState(false);
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

    async function loadCsrf() {
      try {
        const response = await fetch("/api/auth/csrf", { credentials: "same-origin" });
        if (!response.ok) return;
        const data = (await response.json()) as { csrfToken?: string };
        if (!cancelled && data.csrfToken) {
          setCsrfToken(data.csrfToken);
          setReady(true);
        }
      } catch {
        // Button stays disabled until CSRF loads.
      }
    }

    void loadCsrf();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <form action="/api/auth/signin/google" method="POST" className={className}>
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value={resolvedCallback} />
      <GoogleBrandButton type="submit" size="lg" label={label} disabled={!ready} />
    </form>
  );
}
