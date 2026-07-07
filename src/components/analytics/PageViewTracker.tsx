"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const SKIP_PREFIXES = ["/admin", "/api", "/login", "/signup"];

export function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

    lastPath.current = pathname;
    void fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    });
  }, [pathname]);

  return null;
}