"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

const easeOut = [0.22, 1, 0.36, 1] as const;

interface MotionRevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  y?: number;
}

export function MotionReveal({
  children,
  className,
  delay = 0,
  y = 16,
  ...props
}: MotionRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.45, delay, ease: easeOut }}
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
  stagger = 0.08,
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
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
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
              hidden: { opacity: 0, y: 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: easeOut },
              },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: easeOut }}
      className={cn("transition-shadow duration-300", className)}
    >
      {children}
    </motion.div>
  );
}