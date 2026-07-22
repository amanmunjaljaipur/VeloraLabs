"use client";

import { DURATION, EASE_OUT } from "@/lib/motion";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Splits "2hr" -> {value: 2, prefix: "", suffix: "hr"}, "100%" -> {100, "", "%"}. */
function parseNumeric(raw: string): { value: number; prefix: string; suffix: string } | null {
  const match = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)([^\d]*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const value = Number(numStr);
  if (Number.isNaN(value)) return null;
  return { value, prefix, suffix };
}

interface CountUpProps {
  /** e.g. "16", "2hr", "100%", "3" - non-numeric strings render as-is, unanimated. */
  value: string;
  className?: string;
  /** Extra delay before the count-up starts, for staggered groups. */
  delay?: number;
}

/**
 * Animates a numeric label from 0 to its target value once it scrolls into
 * view. Falls back to the plain string immediately for non-numeric values
 * and when prefers-reduced-motion is set.
 */
export function CountUp({ value, className, delay = 0 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduceMotion = useReducedMotion();
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(parsed ? `${parsed.prefix}0${parsed.suffix}` : value);

  useEffect(() => {
    if (!parsed) return;
    if (!inView || reduceMotion) {
      setDisplay(value);
      return;
    }

    const controls = animate(0, parsed.value, {
      duration: DURATION.reveal + 0.5,
      delay,
      ease: EASE_OUT,
      onUpdate: (latest) => {
        const rounded = Number.isInteger(parsed.value) ? Math.round(latest) : Math.round(latest * 10) / 10;
        setDisplay(`${parsed.prefix}${rounded}${parsed.suffix}`);
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
