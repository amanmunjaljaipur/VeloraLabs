---
name: verlin-ui-polish
description: >
  Apply Verlin Labs marketing UI using the controlled design merge, ui-ux-pro-max
  motion/UX rules, and 21st.dev anti-slop component patterns. Use when improving
  homepage, marketing pages, alignment, motion, buttons, cards, or when user
  mentions 21st, ui-ux-pro-max, polish, or design system.
---

# Verlin UI Polish (combined)

## Sources of truth (priority)

1. **Product brand** — teal + amber + navy; `VerlinBrandText` matches logo
2. **`DESIGN-VERLIN.md`** — controlled merge (prod conversion + cream + pills)
3. **ui-ux-pro-max** — Soft UI + micro-interactions + accessibility checklist
4. **21st.dev principles** — fight AI slop: intentional layout, real components, no generic purple gradients

## Layout (anti-slop)

- One content rail: nav + body same `container-verlin` max-width + padding
- **Keep image + text side by side** on heroes and splits (do not full-stack the whole site)
- “Center align” means section titles / optional text-align — **not** replacing two-column layouts
- Quiet section eyebrows (plain uppercase text — never glass pill badges)
- No floating glass cards / sparkles spam on heroes
- Equal grid columns with `min-w-0`
- Soft card hover (2–3px), not bounce

## Typography

- **Display (Cormorant):** page H1 + section H2 only (`.text-display`, `.section-title`)
- **Body (Inter):** UI, cards (`.card-title`, `.card-body`), nav, forms, captions
- Do not mix random display fonts on card H3s


## Motion (ui-ux-pro-max)

- Micro: 150–220ms ease-out
- Scroll reveal: y 12–14px, ~380ms, once
- Stagger: 0.05–0.08s
- `prefers-reduced-motion` + `useReducedMotion`
- `cursor-pointer` on clickables
- Avoid: magnetic cursor, pin-parallax, animate-everything, 500ms+ UI delays

## 21st.dev MCP

When MCP `21st` is connected and `API_KEY_21ST` is set:

1. Search catalog for real components (buttons, pricing, hero) before inventing UI
2. Prefer installable patterns over generating generic Tailwind from scratch
3. Keep Verlin tokens (cream/navy/teal/amber) — restyle components, don’t adopt foreign brand colors

Without API key: still apply 21st **principles** (craft, restraint, real hierarchy) and ui-ux-pro-max motion.

## Do not

- Deploy without user request
- Commit secrets / API keys
- Reintroduce sky-blue brand accents or Bugatti all-caps mono
