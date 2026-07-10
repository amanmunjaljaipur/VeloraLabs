# Demo apps (50 categories)

Deployable layout — each **group** is its own folder so you can ship or edit verticals independently.

```
src/lib/demo-apps/
  types.ts                 # shared types + ent() helper
  index.ts                 # merges all groups → DEMO_CATEGORIES
  build-demo-spec.ts       # DemoCategoryDef → StudioAppSpec
  categories.ts            # thin re-export (compat)
  groups/
    social/index.ts        # 6 apps
    entertainment/index.ts # 6 apps
    fintech/index.ts       # 6 apps
    ecommerce/index.ts     # 6 apps
    utilities/index.ts     # 6 apps
    productivity/index.ts  # 6 apps
    education/index.ts     # 5 apps
    health/index.ts        # 5 apps
    travel/index.ts        # 4 apps
```

## URLs

- Gallery: `/demo-apps`
- One app: `/demo-apps/<slug>` (e.g. `/demo-apps/digital-banking`)

## Validate

```bash
npx tsx scripts/test-demo-apps.ts
```

## Add or edit a category

1. Open the matching `groups/<domain>/index.ts`
2. Add/update a `DemoCategoryDef` object
3. Run `npx tsx scripts/test-demo-apps.ts`
4. Open `/demo-apps/<slug>`

## Runtime

- `productKind: "banking"` → BankingProductApp  
- `productKind: "resume"` → ResumeProductApp  
- everything else → MultiModuleProductApp  
