"use client";

import { DURATION, EASE_OUT } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Site-wide route transition - a quiet fade + rise on every navigation so
 * moving between pages feels considered, not an instant hard cut. Keyed by
 * pathname so each route mount replays it. Deliberately skips exit
 * animations (no AnimatePresence) - coordinating an exit transition across
 * Next.js App Router's server-streamed content is fragile and prone to
 * blank-frame flashes; a clean enter-only transition is the safer premium
 * signal here.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
