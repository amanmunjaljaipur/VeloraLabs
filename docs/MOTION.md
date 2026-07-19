# Motion system (ui-ux-pro-max informed)

Source: [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) motion + UX guidelines, adapted for Verlin Labs education UI.

## Rules we follow

| Rule | Spec |
|------|------|
| Micro-interactions | **150–220ms**, ease-out |
| Scroll reveal | **~380ms**, y **12–14px**, opacity only + transform |
| Stagger | **0.05–0.08s** between items; ≤8 items per group preferred |
| Hover | **transform + opacity** only; button lift **≤1–2px**; card **~2–3px** |
| Press | scale **~0.97** |
| Reduced motion | `useReducedMotion` + `prefers-reduced-motion` — disable lift/reveal |
| Clickables | `cursor-pointer` |
| Avoid | Bounce, magnetic cursor, multi-pin parallax, animate-everything, 500ms+ UI delays |

## Product match

- **Online course / education** → soft press, progress-friendly, gentle reveals  
- **Soft UI Evolution** → soft shadows, 200–300ms transitions  
- **Anti-patterns** → no harsh motion, no AI purple gradient animations  

## Implementation

- Tokens: `src/lib/motion.ts`
- Scroll: `MotionReveal` / `MotionStagger`
- Buttons / cards: Framer Motion hover + CSS transitions
- **Hero media**: `HeroVisual` — looping `public/videos/hero-neural.mp4` + floating glass cards + Ken Burns poster fallback; `prefers-reduced-motion` forces static image
- **Hero copy**: staggered Framer entrance in `HeroSection`
