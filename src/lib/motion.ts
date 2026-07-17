/** Shared motion tokens — SaaS-style subtle animations */
export const EASE_OUT = [0.4, 0, 0.2, 1] as const;

export const DURATION = {
  hover: 0.2,
  press: 0.08,
  nav: 0.15,
  reveal: 0.5,
  stagger: 0.08,
  menu: 0.25,
  success: 0.3,
} as const;

export const HOVER = {
  buttonScale: { primary: 1.01, cta: 1.01, secondary: 1.01 } as const,
  tapScale: 0.95,
  cardLift: -2,
  iconScale: 1.05,
} as const;

export const REVEAL = {
  y: 20,
  opacity: 0,
} as const;