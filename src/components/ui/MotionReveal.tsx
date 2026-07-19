"use client";

import { DURATION, EASE_OUT, REVEAL } from "@/lib/motion";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

interface MotionRevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  y?: number;
}

/**
 * Scroll reveal - ui-ux-pro-max "Scroll Reveal / Subtle":
 * opacity + small y (8–16px), ~350ms, ease-out, once in view.
 */
export function MotionReveal({
  children,
  className,
  delay = 0,
  y = REVEAL.y,
  ...props
}: MotionRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: REVEAL.opacity, y }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: DURATION.reveal, delay, ease: EASE_OUT }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionStagger({
  children,
  className,
  stagger = DURATION.stagger,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, margin: "-8% 0px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : stagger,
            delayChildren: reduceMotion ? 0 : 0.04,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionStaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={
        reduceMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 12 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: DURATION.reveal, ease: EASE_OUT },
              },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
