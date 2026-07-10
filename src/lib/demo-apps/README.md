# Demo apps (50 categories)

Interactive multi-role product demos at `/demo-apps` and `/demo-apps/[slug]`.

These are **production-style product shells**, not jokes: industry navigation, multi-column footers, compliance disclaimers, and Verlin educational content.

## Layers

| Layer | Path |
|-------|------|
| Industry nav + footer IA | `industry-shells.ts` (group baselines + slug overrides) |
| Educational content packs | `learning-content.ts` |
| Thin-copy upgrades | `premiumize.ts` |
| Spec builder | `build-demo-spec.ts` → `StudioAppSpec.shell` + `.learning` |
| Runtime chrome | `MultiModuleProductApp` (sidebar / top tabs / bottom tabs + footer) |

## Navigation patterns (researched)

| Pattern | Verticals | Benchmarks |
|---------|-----------|------------|
| `bottom-tabs` | social, ecom, education, health, travel, media, utilities | Material 3–5 destinations |
| `sidebar` | productivity / workplace | Slack, Asana, Notion |
| `hybrid` | fintech | PhonePe, bank apps, Revolut |

## Footer standard

Columns: **Product · Support · Legal · industry-specific** (Banking, Safety, Sell with us, Care, etc.)  
Always includes copyright, disclaimers, trust badges, support line.

## Content voice

- Class-8 English, concrete jobs, finish lines  
- India-aware where natural  
- Honest limits (no real money, medical, or licensed content claims)  

## Adding a category

1. Blueprint in `groups/<domain>/index.ts`  
2. Learning pack in `learning-content.ts`  
3. Optional slug IA override in `industry-shells.ts`  
4. `npm run build`  
