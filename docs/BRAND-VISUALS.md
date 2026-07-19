# Brand visual system (product + design)

## Product story (owner lens)

Verlin Labs sells **clarity**, not AI hype. Every visual should answer:

> “Will this help me understand AI without drowning in noise?”

| Surface | Job | Asset | Motion |
|---------|-----|-------|--------|
| **Home hero** | Brand + convert to free session | `brand-hero-clarity` + `hero-clarity.mp4` | Loop + float chips + stagger copy |
| **Free session** | Trust + book | `brand-free-session` + `free-session.mp4` | Soft loop + Free badge |
| **How it works** | Path to demo day | `brand-journey` | Ken Burns + step cards |
| **Mental models split** | Prove teaching method | `brand-mental-models` | Hover scale |
| **Hands-on split** | Prove practicality | `brand-hands-on` | Hover scale |
| **Contact** | Human connection | `brand-contact` | Ken Burns |
| **OG / social** | Share card | `brand-hero-clarity` | n/a |

## Art direction

- **Do:** deep navy, teal structure, amber “aha”, soft light, frameworks, maps, modules  
- **Don’t:** purple AI slop, robots, stock “pointing at laptop”, busy UI chrome with fake text  

## Code

- Registry: `src/lib/brand-media.ts`
- Media panel: `src/components/sections/HeroVisual.tsx`
- CMS: `content/home-content.json` (keep paths in sync)

## Reduced motion

Video + Ken Burns + float loops off when `prefers-reduced-motion: reduce`.
