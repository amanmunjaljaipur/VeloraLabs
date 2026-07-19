/**
 * Motion tokens aligned with ui-ux-pro-max skill (education / Soft UI / micro-interactions).
 * - Hover micro: 150–200ms, transform/opacity only, ≤2px lift
 * - Scroll reveal: 300–400ms subtle, y 8–16px
 * - Stagger lists: 0.03–0.08s per item
 * - Prefer ease-out for enter; respect prefers-reduced-motion in consumers
 */

/** ease-out cubic - entering UI (skill: power1/power2.out ≈ cubic-bezier) */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** slight ease-in-out for reversible chrome (nav, menus) */
export const EASE_INOUT = [0.4, 0, 0.2, 1] as const;

export const DURATION = {
  /** Hover / press feedback - skill 150–200ms */
  hover: 0.18,
  press: 0.1,
  /** Nav underline / chrome */
  nav: 0.2,
  /** Scroll reveal - skill 300–400ms subtle */
  reveal: 0.38,
  /** Stagger between children - skill 0.03–0.08 */
  stagger: 0.06,
  menu: 0.22,
  success: 0.28,
} as const;

export const HOVER = {
  /** Subtle press feedback - under 2% scale so it reads as feedback not bounce */
  buttonScale: { primary: 1.015, cta: 1.02, secondary: 1.01 } as const,
  tapScale: 0.97,
  /** Card lift ≤4px standard tier; keep modest for education UI */
  cardLift: -3,
  iconScale: 1.04,
} as const;

export const REVEAL = {
  /** Skill subtle scroll: y 8–16px */
  y: 14,
  opacity: 0,
} as const;

/** Framer transition presets */
export const TRANSITION = {
  hover: { duration: DURATION.hover, ease: EASE_OUT },
  press: { duration: DURATION.press, ease: EASE_INOUT },
  reveal: { duration: DURATION.reveal, ease: EASE_OUT },
  menu: { duration: DURATION.menu, ease: EASE_INOUT },
} as const;
