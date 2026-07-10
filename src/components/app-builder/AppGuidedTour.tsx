"use client";

import type { AppRoute } from "@/components/app-builder/StandaloneAppRuntime";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  /** Navigate public/admin route when this step is active */
  route: AppRoute;
  /** Optional highlight selector */
  target?: string;
};

function storageKey(slug: string) {
  return `vl-app-tour-done:${slug}`;
}

export function buildDefaultTour(brandName: string, opts?: { includeAdmin?: boolean }): TourStep[] {
  const steps: TourStep[] = [
    {
      id: "welcome",
      title: `Welcome to ${brandName}`,
      body: "This short tour shows you every main page of this shop. Tap Next to walk through — you can skip anytime.",
      route: "home",
      target: "[data-tour='header']",
    },
    {
      id: "home",
      title: "Home",
      body: "Your story, logo, and featured products appear here. Visitors land here first when they open your link.",
      route: "home",
      target: "[data-tour='header']",
    },
    {
      id: "products",
      title: "Products",
      body: "Browse everything you sell. Customers can filter by category and place a simple order from a product card.",
      route: "shop",
    },
    {
      id: "about",
      title: "About",
      body: "Tell people who you are and why they should trust your local shop — in simple words.",
      route: "about",
    },
    {
      id: "help",
      title: "Help / FAQ",
      body: "Common questions about orders, delivery, and payment — so you get fewer repeat calls.",
      route: "faq",
    },
    {
      id: "contact",
      title: "Contact",
      body: "Phone, WhatsApp, email, and address live here so customers can reach you in one tap.",
      route: "contact",
    },
    {
      id: "account",
      title: "Sign in & account",
      body: "Customers can create an account for this shop only (separate from Verlin Labs). You can also open Dashboard if you are the owner.",
      route: "login",
      target: "[data-tour='auth-actions']",
    },
    {
      id: "footer",
      title: "Footer",
      body: "The footer repeats contact and page links so people always find a way to reach you — and shows this app was built with App Builder.",
      route: "home",
      target: "[data-tour='footer']",
    },
  ];

  if (opts?.includeAdmin) {
    steps.push({
      id: "admin",
      title: "Your admin Dashboard",
      body: "Owners and staff use Dashboard for Site CMS, CRM, orders, products, roles, and settings — laid out like Verlin Labs admin.",
      route: "admin",
    });
  }

  steps.push({
    id: "done",
    title: "You’re ready",
    body: "That’s the full shop. Share your link with customers. You can replay this tour anytime from the Help tip on Home.",
    route: "home",
  });

  return steps;
}

export function AppGuidedTour({
  slug,
  brandName,
  accent,
  includeAdmin,
  onNavigate,
  forceOpen,
  onCloseForce,
}: {
  slug: string;
  brandName: string;
  accent: string;
  includeAdmin?: boolean;
  onNavigate: (route: AppRoute) => void;
  /** Parent can open tour again */
  forceOpen?: boolean;
  onCloseForce?: () => void;
}) {
  const steps = useMemo(
    () => buildDefaultTour(brandName, { includeAdmin }),
    [brandName, includeAdmin]
  );

  // First visit: open tour unless localStorage says done
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(storageKey(slug)) !== "1";
    } catch {
      return true;
    }
  });
  const [index, setIndex] = useState(0);
  const [lastForce, setLastForce] = useState(false);

  // Parent requested replay (Take a tour button)
  if (forceOpen && !lastForce) {
    setLastForce(true);
    setIndex(0);
    setOpen(true);
  } else if (!forceOpen && lastForce) {
    setLastForce(false);
  }

  const step = steps[index];
  const total = steps.length;
  const isLast = index >= total - 1;

  // Navigate page when step changes (async-friendly)
  useEffect(() => {
    if (!open || !step) return;
    const t = window.setTimeout(() => onNavigate(step.route), 0);
    return () => window.clearTimeout(t);
  }, [open, step, onNavigate]);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(storageKey(slug), "1");
    } catch {
      // ignore
    }
    setOpen(false);
    onCloseForce?.();
    onNavigate("home");
  }, [slug, onCloseForce, onNavigate]);

  const next = () => {
    if (isLast) finish();
    else setIndex((i) => i + 1);
  };

  const back = () => setIndex((i) => Math.max(0, i - 1));

  if (!open || !step) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-tour-title"
    >
      <div
        className="absolute inset-0"
        onClick={() => {
          /* require explicit skip */
        }}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        )}
      >
        <div
          className="flex items-center justify-between gap-2 px-4 py-3 text-white"
          style={{ background: `linear-gradient(135deg, ${accent}, #0a1628)` }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Guided tour
          </div>
          <button
            type="button"
            className="rounded-lg p-1 hover:bg-white/10"
            aria-label="Skip tour"
            onClick={finish}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Step {index + 1} of {total}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round(((index + 1) / total) * 100)}%`,
                background: accent,
              }}
            />
          </div>
          <h2 id="app-tour-title" className="text-xl font-semibold tracking-tight text-foreground">
            {step.title}
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">{step.body}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            className="text-xs font-medium text-text-muted underline"
            onClick={finish}
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={back}
              className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-medium disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white"
              style={{ background: accent }}
            >
              {isLast ? "Finish" : "Next"}
              {!isLast ? <ArrowRight className="h-3.5 w-3.5" /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small control to replay tour */
export function AppTourReplayButton({
  accent,
  onClick,
}: {
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm hover:border-accent-teal/40"
      style={{ color: accent }}
      data-tour="replay-tour"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Take a tour
    </button>
  );
}
