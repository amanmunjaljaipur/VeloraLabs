"use client";

import type { AppRoute } from "@/components/app-builder/StandaloneAppRuntime";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

/** One arrow + tip pointing at a page element */
export type TourAnnotation = {
  target: string;
  title: string;
  body: string;
  /** Preferred side of the element for the arrow tip card (tail of arrow) */
  side?: "top" | "bottom" | "left" | "right";
};

export type TourStep = {
  id: string;
  /** Short label in the top control bar */
  title: string;
  route: AppRoute;
  /** Multiple annotations = multiple arrows on the same page */
  annotations: TourAnnotation[];
  /** When no annotations (welcome / done), show this on the overlay */
  body?: string;
};

type Measured = {
  target: string;
  title: string;
  body: string;
  side: "top" | "bottom" | "left" | "right";
  rect: DOMRect;
  /** Tip card position (tail of arrow) */
  tip: { x: number; y: number; w: number; h: number };
  /** Arrow: from tip edge → target edge */
  from: { x: number; y: number };
  to: { x: number; y: number };
};

function storageKey(slug: string) {
  return `vl-app-tour-done:${slug}`;
}

const TIP_W = 240;
const TIP_H = 108;
const GAP = 28;
const PAD = 10;

function pickSide(
  preferred: TourAnnotation["side"],
  rect: DOMRect,
  vw: number,
  vh: number
): "top" | "bottom" | "left" | "right" {
  if (preferred) return preferred;
  const space = {
    top: rect.top,
    bottom: vh - rect.bottom,
    left: rect.left,
    right: vw - rect.right,
  };
  const order = (Object.keys(space) as Array<keyof typeof space>).sort(
    (a, b) => space[b] - space[a]
  );
  return order[0];
}

function layoutAnnotation(
  ann: TourAnnotation,
  rect: DOMRect,
  vw: number,
  vh: number,
  index: number
): Measured {
  const side = pickSide(ann.side, rect, vw, vh);
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let tipX = 0;
  let tipY = 0;
  let from = { x: 0, y: 0 };
  let to = { x: 0, y: 0 };

  // Slight stagger so multi-tips on one page don't stack perfectly
  const stagger = (index % 3) * 12;

  switch (side) {
    case "top":
      tipX = Math.min(Math.max(PAD, cx - TIP_W / 2 + stagger), vw - TIP_W - PAD);
      tipY = Math.max(PAD + 56, rect.top - GAP - TIP_H);
      from = { x: tipX + TIP_W / 2, y: tipY + TIP_H };
      to = { x: cx, y: rect.top - 4 };
      break;
    case "bottom":
      tipX = Math.min(Math.max(PAD, cx - TIP_W / 2 - stagger), vw - TIP_W - PAD);
      tipY = Math.min(vh - TIP_H - PAD, rect.bottom + GAP);
      from = { x: tipX + TIP_W / 2, y: tipY };
      to = { x: cx, y: rect.bottom + 4 };
      break;
    case "left":
      tipX = Math.max(PAD, rect.left - GAP - TIP_W);
      tipY = Math.min(Math.max(PAD + 56, cy - TIP_H / 2 + stagger), vh - TIP_H - PAD);
      from = { x: tipX + TIP_W, y: tipY + TIP_H / 2 };
      to = { x: rect.left - 4, y: cy };
      break;
    case "right":
    default:
      tipX = Math.min(vw - TIP_W - PAD, rect.right + GAP);
      tipY = Math.min(Math.max(PAD + 56, cy - TIP_H / 2 - stagger), vh - TIP_H - PAD);
      from = { x: tipX, y: tipY + TIP_H / 2 };
      to = { x: rect.right + 4, y: cy };
      break;
  }

  return {
    target: ann.target,
    title: ann.title,
    body: ann.body,
    side,
    rect,
    tip: { x: tipX, y: tipY, w: TIP_W, h: TIP_H },
    from,
    to,
  };
}

function arrowPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Soft curve: control points pull perpendicular to the main direction
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * Math.min(40, len * 0.25);
  const ny = (dx / len) * Math.min(40, len * 0.25);
  return `M ${from.x} ${from.y} Q ${mx + nx} ${my + ny} ${to.x} ${to.y}`;
}

export function buildDefaultTour(brandName: string, opts?: { includeAdmin?: boolean }): TourStep[] {
  const steps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome",
      route: "home",
      annotations: [],
      body: `Welcome to ${brandName}. We’ll point at each important part of your shop with arrows. Follow the tips at the tail of each arrow — you can skip anytime.`,
    },
    {
      id: "top-bar",
      title: "Top menu",
      route: "home",
      annotations: [
        {
          target: "[data-tour='brand']",
          title: "Your brand",
          body: "Logo and shop name — click anytime to return to Home (same idea as the Verlin Labs logo).",
          side: "bottom",
        },
        {
          target: "[data-tour='nav']",
          title: "Page links",
          body: "Main pages stay here on every screen — Home, Products/About, and more. Works from the public site and while you’re in admin.",
          side: "bottom",
        },
        {
          target: "[data-tour='auth-actions']",
          title: "Account & tour",
          body: "Sign in, join, open Dashboard if you’re staff, or replay this tour anytime.",
          side: "bottom",
        },
      ],
    },
    {
      id: "home",
      title: "Home page",
      route: "home",
      annotations: [
        {
          target: "[data-tour='hero']",
          title: "Hero banner",
          body: "Your story, headline, and main call-to-action. First thing customers see.",
          side: "bottom",
        },
        {
          target: "[data-tour='featured']",
          title: "Featured products",
          body: "Popular picks pulled from your catalogue so people can order quickly.",
          side: "top",
        },
      ],
    },
    {
      id: "products",
      title: "Products",
      route: "shop",
      annotations: [
        {
          target: "[data-tour='products']",
          title: "Full catalogue",
          body: "Everything you sell. Customers can filter by category and place a simple order.",
          side: "bottom",
        },
      ],
    },
    {
      id: "about",
      title: "About",
      route: "about",
      annotations: [
        {
          target: "[data-tour='about']",
          title: "Your story",
          body: "Tell people who you are and why they should trust your local shop — in plain words.",
          side: "bottom",
        },
      ],
    },
    {
      id: "help",
      title: "Help / FAQ",
      route: "faq",
      annotations: [
        {
          target: "[data-tour='faq']",
          title: "Common questions",
          body: "Orders, delivery, payment — fewer repeat calls when answers live here.",
          side: "bottom",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      route: "contact",
      annotations: [
        {
          target: "[data-tour='contact']",
          title: "Reach you",
          body: "Phone, WhatsApp, email, and address in one place for one-tap contact.",
          side: "bottom",
        },
      ],
    },
    {
      id: "account",
      title: "Sign in",
      route: "login",
      annotations: [
        {
          target: "[data-tour='auth-form']",
          title: "Shop login only",
          body: "Customers create an account for this shop only — separate from Verlin Labs.",
          side: "right",
        },
        {
          target: "[data-tour='auth-actions']",
          title: "Always in the header",
          body: "Sign in / Join stay in the top bar so people never get lost.",
          side: "bottom",
        },
      ],
    },
    {
      id: "footer",
      title: "Footer",
      route: "home",
      annotations: [
        {
          target: "[data-tour='footer']",
          title: "Footer links & contact",
          body: "Repeats page links and contact so people always find a way to reach you.",
          side: "top",
        },
      ],
    },
  ];

  if (opts?.includeAdmin) {
    steps.push({
      id: "admin",
      title: "Dashboard",
      route: "admin",
      annotations: [
        {
          target: "[data-tour='admin-sidebar']",
          title: "Left menu",
          body: "Overview → Products → Orders → CRM → Site CMS → Brand & theme → Team → Roles. Active item uses your brand colour.",
          side: "right",
        },
        {
          target: "[data-tour='nav']",
          title: "Leave admin anytime",
          body: "Shop pages stay in the top menu. Use Back to shop or Home when you’re done editing.",
          side: "bottom",
        },
        {
          target: "[data-tour='back-to-shop']",
          title: "Back to shop",
          body: "One click returns you to the customer-facing storefront.",
          side: "bottom",
        },
      ],
    });
    steps.push({
      id: "admin-products",
      title: "Product photos",
      route: "admin-products",
      annotations: [
        {
          target: "[data-tour='admin-products']",
          title: "Your own product photos",
          body: "For each product you can Upload your photo, paste a link, or Find photos (web + custom AI). Always Save products when done.",
          side: "bottom",
        },
      ],
    });
    steps.push({
      id: "admin-theme",
      title: "Brand & theme",
      route: "admin-settings",
      annotations: [
        {
          target: "[data-tour='admin-settings']",
          title: "Multi-colour brand",
          body: "Paste your website link and/or upload your logo to pull multi-colour theme colours. Buttons, nav, and accents use the full palette — not one colour only.",
          side: "bottom",
        },
        {
          target: "[data-tour='admin-theme']",
          title: "Website, logo & theme",
          body: "Website URL → Pull theme · or logo/photo → Build theme → tweak palette → Save brand & theme. Your logo on the live app always opens Home.",
          side: "top",
        },
      ],
    });
    steps.push({
      id: "content-agent",
      title: "Shop wording",
      route: "admin",
      annotations: [
        {
          target: "[data-tour='content-agent']",
          title: "Improve shop wording",
          body: "One tap rewrites Home, About, FAQs and Google title/description from your products and city — clear, local, SEO-ready.",
          side: "bottom",
        },
      ],
    });
  }

  steps.push({
    id: "done",
    title: "You’re ready",
    route: "home",
    annotations: [],
    body: "That’s the full shop. Upload product photos and set Brand & theme from your logo in Dashboard when ready. Replay this tour anytime with “Take a tour” in the top bar.",
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
  forceOpen?: boolean;
  onCloseForce?: () => void;
}) {
  const steps = useMemo(
    () => buildDefaultTour(brandName, { includeAdmin }),
    [brandName, includeAdmin]
  );

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
  const [measured, setMeasured] = useState<Measured[]>([]);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

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

  // Navigate page when step changes
  useEffect(() => {
    if (!open || !step) return;
    const t = window.setTimeout(() => onNavigate(step.route), 0);
    return () => window.clearTimeout(t);
  }, [open, step, onNavigate]);

  const remeasure = useCallback(() => {
    if (!open || !step || typeof window === "undefined") return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setViewport({ w: vw, h: vh });

    const next: Measured[] = [];
    step.annotations.forEach((ann, i) => {
      // Prefer primary target; fall back for responsive admin chrome
      let el = document.querySelector(ann.target);
      if (!el && ann.target.includes("admin-sidebar")) {
        el = document.querySelector("[data-tour='admin-nav-mobile']");
      }
      if (!el && ann.target.includes("admin-sidebar")) {
        el = document.querySelector("[data-tour='admin-panel']");
      }
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Skip zero-size (e.g. desktop-only sidebar on mobile)
      if (rect.width < 2 || rect.height < 2) {
        const fallback =
          document.querySelector("[data-tour='admin-nav-mobile']") ||
          document.querySelector("[data-tour='admin-panel']");
        if (!fallback || ann.target.indexOf("admin") === -1) return;
        const fr = fallback.getBoundingClientRect();
        if (fr.width < 2 || fr.height < 2) return;
        if (i === 0) {
          fallback.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        }
        next.push(layoutAnnotation(ann, fr, vw, vh, i));
        return;
      }
      if (i === 0) {
        el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      }
      next.push(layoutAnnotation(ann, rect, vw, vh, i));
    });
    setMeasured(next);
  }, [open, step]);

  // Remeasure after route paint + on resize/scroll (allow scroll so footer/featured can enter view)
  useLayoutEffect(() => {
    if (!open) return;
    const t1 = window.setTimeout(remeasure, 80);
    const t2 = window.setTimeout(remeasure, 320);
    const t3 = window.setTimeout(remeasure, 700);
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
  }, [open, step?.id, remeasure]);

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

  const vw = viewport.w || (typeof window !== "undefined" ? window.innerWidth : 1200);
  const vh = viewport.h || (typeof window !== "undefined" ? window.innerHeight : 800);
  const hasAnnotations = step.annotations.length > 0;
  const showCenteredCard = !hasAnnotations || measured.length === 0;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-tour-title"
    >
      {/* Dim overlay with cutouts for each highlight */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        width={vw}
        height={vh}
        viewBox={`0 0 ${vw} ${vh}`}
        aria-hidden
      >
        <defs>
          <mask id="vl-tour-mask">
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {measured.map((m, i) => (
              <rect
                key={`hole-${i}`}
                x={m.rect.left - 6}
                y={m.rect.top - 6}
                width={m.rect.width + 12}
                height={m.rect.height + 12}
                rx="12"
                fill="black"
              />
            ))}
          </mask>
          <marker
            id="vl-tour-arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill={accent} />
          </marker>
        </defs>
        <rect
          x="0"
          y="0"
          width={vw}
          height={vh}
          fill="rgba(8, 12, 20, 0.72)"
          mask="url(#vl-tour-mask)"
          style={{ pointerEvents: "auto" }}
        />
        {/* Highlight rings */}
        {measured.map((m, i) => (
          <rect
            key={`ring-${i}`}
            x={m.rect.left - 6}
            y={m.rect.top - 6}
            width={m.rect.width + 12}
            height={m.rect.height + 12}
            rx="12"
            fill="none"
            stroke={accent}
            strokeWidth="2.5"
            className="animate-pulse"
            style={{ filter: `drop-shadow(0 0 8px ${accent}88)` }}
          />
        ))}
        {/* Arrows: tip (tail of guidance) → target */}
        {measured.map((m, i) => (
          <path
            key={`arrow-${i}`}
            d={arrowPath(m.from, m.to)}
            fill="none"
            stroke={accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#vl-tour-arrowhead)"
            opacity={0.95}
          />
        ))}
        {/* Dot at tail (tip card side) */}
        {measured.map((m, i) => (
          <circle key={`dot-${i}`} cx={m.from.x} cy={m.from.y} r="4" fill={accent} />
        ))}
      </svg>

      {/* Click catcher (non-cutout areas already dimmed; block interaction) */}
      <div className="absolute inset-0" style={{ pointerEvents: "none" }} />

      {/* Top control bar */}
      <div className="pointer-events-auto absolute left-0 right-0 top-0 z-[110] flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0a1628]/95 px-3 py-2.5 text-white shadow-lg backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" style={{ color: accent }} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" id="app-tour-title">
              Guided tour · {step.title}
            </p>
            <p className="text-[11px] text-white/70">
              Step {index + 1} of {total}
              {measured.length > 1 ? ` · ${measured.length} tips on this page` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/15 sm:block">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round(((index + 1) / total) * 100)}%`,
                background: accent,
              }}
            />
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs font-medium text-white/80 underline hover:text-white"
            onClick={finish}
          >
            Skip
          </button>
          <button
            type="button"
            disabled={index === 0}
            onClick={back}
            className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-medium disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: accent }}
          >
            {isLast ? "Finish" : "Next"}
            {!isLast ? <ArrowRight className="h-3.5 w-3.5" /> : null}
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 hover:bg-white/10"
            aria-label="Close tour"
            onClick={finish}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tip cards at arrow tails */}
      {measured.map((m, i) => (
        <div
          key={`tip-${i}`}
          className="pointer-events-auto absolute z-[120] overflow-hidden rounded-xl border border-white/15 bg-card text-foreground shadow-2xl"
          style={{
            left: m.tip.x,
            top: m.tip.y,
            width: m.tip.w,
            maxWidth: `min(${TIP_W}px, calc(100vw - 20px))`,
          }}
        >
          <div
            className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ background: `linear-gradient(135deg, ${accent}, #0a1628)` }}
          >
            Tip {i + 1}
            {measured.length > 1 ? ` of ${measured.length}` : ""}
          </div>
          <div className="space-y-1 px-3 py-2.5">
            <p className="text-sm font-semibold leading-snug">{m.title}</p>
            <p className="text-xs leading-relaxed text-text-secondary">{m.body}</p>
          </div>
        </div>
      ))}

      {/* Welcome / done / fallback when targets not found — still overlay, not a modal popup */}
      {showCenteredCard ? (
        <div className="pointer-events-auto absolute left-1/2 top-1/2 z-[120] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 bg-card shadow-2xl">
          <div
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${accent}, #0a1628)` }}
          >
            <Sparkles className="h-4 w-4" />
            {step.title}
          </div>
          <div className="space-y-3 px-5 py-5">
            <p className="text-sm leading-relaxed text-text-secondary">
              {step.body ||
                (hasAnnotations
                  ? "Looking for the highlighted parts of this page…"
                  : "Continue when you’re ready.")}
            </p>
            <div className="flex justify-end gap-2">
              {index > 0 ? (
                <button
                  type="button"
                  onClick={back}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-medium"
                >
                  Back
                </button>
              ) : null}
              <button
                type="button"
                onClick={next}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: accent }}
              >
                {isLast ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Small control to replay tour — show in top bar for shop and admin */
export function AppTourReplayButton({
  accent,
  onClick,
  className,
}: {
  accent: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm hover:border-accent-teal/40",
        className
      )}
      style={{ color: accent }}
      data-tour="replay-tour"
      title="Show the guided tour overlay again"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Take a tour
    </button>
  );
}
