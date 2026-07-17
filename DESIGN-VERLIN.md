# Verlin Labs · Controlled merge (ship candidate)

**Sources:** Production Verlin system + Apple chrome + Claude cream/editorial  
**Status:** Local candidate — not deployed to prod.  
**Active design docs:** `DESIGN-VERLIN.md` (this file) + reference `DESIGN.md` / `bugatti/` / `spacex/` for experiments only.

## What we ship

| Layer | Choice | Why |
|-------|--------|-----|
| **Hero** | Prod **dark navy** split + full-width amber CTA | Conversion for free session |
| **Page body** | Claude **cream canvas** `#faf9f5` | Distinctive, calm reading |
| **Cards** | **White** on cream + soft shadow | Prod scannability |
| **Display** | Cormorant Garamond on titles only | Editorial without soft labels |
| **Body** | Inter ~17px | Apple readability |
| **CTAs** | Apple **pills** + amber bold | Shape + Verlin brand |
| **Nav** | Frosted cream, ~56–64px | Apple chrome + room for links |
| **Light** | Cream default | Marketing |
| **Dark** | Prod **slate** `#0f172a` | Product/admin density |

## Avoided

- Full Apple museum spacing  
- Full cream cards everywhere (harder to scan)  
- Bugatti all-caps mono  
- Light-only cream hero (weaker conversion)
