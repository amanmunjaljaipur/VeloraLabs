"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Thin top-of-page progress bar for client-side route transitions.
 *
 * Next.js App Router gives us no native "navigation start/end" event, so
 * this uses a pragmatic two-signal approach:
 *  1. START - a capture-phase click listener on internal <a>/Link clicks
 *     fires immediately on user intent, before the route change commits.
 *  2. END - the pathname/searchParams change effect fires once the new
 *     route has actually rendered, so we snap to 100% and fade out.
 *
 * This mainly helps on pages without a route-level `loading.tsx` (most of
 * the site), giving instant feedback that a click registered instead of a
 * dead-feeling pause - which is what "wherever it's taking time, show a
 * loader" is asking for at the site-wide level.
 */
function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<number[]>([]);
  const firstRender = useRef(true);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      const isInternal =
        href.startsWith("/") && !href.startsWith("//") ? true : href.startsWith(window.location.origin);
      const opensNewTab = anchor.target && anchor.target !== "_self";
      const isDownload = anchor.hasAttribute("download");
      const isHashOnly = href.startsWith("#");

      if (!isInternal || opensNewTab || isDownload || isHashOnly) return;

      // Same-page link (identical pathname+search) - nothing to show.
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      clearTimers();
      setActive(true);
      setWidth(15);
      timers.current.push(window.setTimeout(() => setWidth(45), 100));
      timers.current.push(window.setTimeout(() => setWidth(70), 500));
      timers.current.push(window.setTimeout(() => setWidth(85), 1200));
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!active) return;

    clearTimers();
    setWidth(100);
    const hide = window.setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 250);
    timers.current.push(hide);

    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => clearTimers, []);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[200] h-[3px] w-full bg-transparent"
      role="progressbar"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-accent-teal via-teal to-accent-teal shadow-[0_0_8px_var(--accent-teal)] transition-all duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
