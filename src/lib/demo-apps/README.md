# Demo apps (50 categories)

Interactive multi-role product demos at `/demo-apps` and `/demo-apps/[slug]`.

## Content quality (Verlin Labs educational voice)

Every category is **premiumized** before it becomes a `StudioAppSpec`:

| Layer | Path |
|-------|------|
| Handcrafted packs (all 50) | `learning-content.ts` |
| Thin-copy upgrades | `premiumize.ts` |
| Spec builder | `build-demo-spec.ts` |
| Catalog export | `index.ts` → `DEMO_CATEGORIES` (already premiumized) |

Each pack includes: outcome-led tagline, 2–3 sentence description, hero, who it’s for, outcomes, how-it-works, trust lines, FAQs, role/module copy, and richer seed rows.

**Voice rules** (same as App Content Agent / courses):

- Class-8 English, short sentences  
- Concrete jobs and finish lines — no “world-class” fluff  
- India-aware examples where natural  
- Honest demo limits (mock APIs, no real money/health claims)  

## Layout

```
types.ts
learning-content.ts
premiumize.ts
build-demo-spec.ts
groups/<domain>/index.ts   ← structure + base seeds
index.ts
```

## Adding a category

1. Add blueprint to the right `groups/<domain>/index.ts`  
2. Add a full pack in `learning-content.ts` under the same `slug`  
3. Run `assertFiftyCategories` via build / `npm run build`  
