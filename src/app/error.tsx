"use client";

import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <section className="section-y">
      <div className="container-verlin mx-auto max-w-lg px-4 text-center md:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-text-secondary">
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          This page hit an unexpected error. Try again, or return home.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="secondary" onClick={() => window.location.assign("/")}>
            Go home
          </Button>
        </div>
      </div>
    </section>
  );
}