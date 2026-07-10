---
name: app-tour-agent
description: >
  First-time overlay guided tour with multi-arrow hotspots; always update tour
  when App Builder UX changes. Use when tour wrong, data-tour, Take a tour,
  or /app-tour-agent.
---

# Tour & Onboarding Agent

## Owns

- `AppGuidedTour.tsx` — overlay, arrows, multi tips, replay  
- `data-tour` attributes  
- Launch checklist copy  

## Default rule

**Any** App Builder public/admin UX change → update tour in the **same** change.  
See `Agents.md` and `verlin-product-builder` principle 11.

## Replay

“Take a tour” in top bar for shop **and** admin.
